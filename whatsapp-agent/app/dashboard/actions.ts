"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTenant } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import type { BookingStatus, OpeningHours, OrderStatus, WeekdayKey } from "@/lib/db/schema";
import { handleInbound } from "@/lib/inbound";
import { sendToCustomer } from "@/lib/messaging";
import { koboFromNaira } from "@/lib/money";
import { ORDER_STATUS_MESSAGES } from "@/lib/orders";

const { customers, orders, bookings, tenants, catalogItems } = schema;

async function ownCustomer(customerId: string) {
  const tenant = await requireTenant();
  const db = await getDb();
  const customer = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.tenantId, tenant.id)),
  });
  if (!customer) throw new Error("Chat not found");
  return { tenant, db, customer };
}

export async function takeOver(customerId: string) {
  const { db, customer } = await ownCustomer(customerId);
  await db.update(customers).set({ mode: "human", handoverReason: customer.handoverReason ?? "Taken over from the dashboard." }).where(eq(customers.id, customer.id));
  revalidatePath(`/dashboard/chats/${customerId}`);
}

export async function handBack(customerId: string) {
  const { db, customer } = await ownCustomer(customerId);
  await db.update(customers).set({ mode: "ai", needsAttention: false, handoverReason: null }).where(eq(customers.id, customer.id));
  revalidatePath(`/dashboard/chats/${customerId}`);
  revalidatePath("/dashboard", "layout");
}

export async function markSeen(customerId: string) {
  const { db, customer } = await ownCustomer(customerId);
  await db.update(customers).set({ needsAttention: false }).where(eq(customers.id, customer.id));
  revalidatePath("/dashboard", "layout");
}

export async function sendOwnerReply(customerId: string, _prev: { error?: string } | undefined, form: FormData) {
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { error: "Type a message first." };
  const { tenant, db, customer } = await ownCustomer(customerId);
  // Replying means a person is handling the chat, so the AI steps back until handed back.
  await db.update(customers).set({ mode: "human", needsAttention: false, handoverReason: customer.handoverReason ?? "Owner replied from the dashboard." }).where(eq(customers.id, customer.id));
  const sent = await sendToCustomer(db, tenant, customer, body, { author: "owner" });
  revalidatePath(`/dashboard/chats/${customerId}`);
  if (sent.status === "failed") return { error: `Not delivered: ${sent.error}` };
  return {};
}

const ORDER_STATUSES: OrderStatus[] = ["paid", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];

export async function updateOrderStatus(orderId: string, form: FormData) {
  const status = String(form.get("status")) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return;
  const tenant = await requireTenant();
  const db = await getDb();
  const [order] = await db
    .update(orders)
    .set({ status })
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenant.id)))
    .returning();
  if (!order) return;
  const message = ORDER_STATUS_MESSAGES[status]?.(order, tenant);
  if (message) {
    const customer = (await db.query.customers.findFirst({ where: eq(customers.id, order.customerId) }))!;
    await sendToCustomer(db, tenant, customer, message, {
      author: "system",
      template: { name: "order_update", params: [order.code, tenant.name, status.replaceAll("_", " ")] },
    });
  }
  revalidatePath("/dashboard/orders");
}

const BOOKING_STATUSES: BookingStatus[] = ["confirmed", "completed", "no_show", "cancelled"];

export async function updateBookingStatus(bookingId: string, form: FormData) {
  const status = String(form.get("status")) as BookingStatus;
  if (!BOOKING_STATUSES.includes(status)) return;
  const tenant = await requireTenant();
  const db = await getDb();
  const [booking] = await db
    .update(bookings)
    .set({ status })
    .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)))
    .returning();
  if (booking && status === "cancelled") {
    const customer = (await db.query.customers.findFirst({ where: eq(customers.id, booking.customerId) }))!;
    await sendToCustomer(db, tenant, customer, `Your ${booking.serviceName} booking (${booking.code}) has been cancelled by ${tenant.name}. Reply here to pick a new time.`, {
      author: "system",
      template: { name: "order_update", params: [booking.code, tenant.name, "cancelled"] },
    });
  }
  revalidatePath("/dashboard/bookings");
}

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  address: z.string().trim().max(300),
  ownerPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d]/g, ""))
    .refine((v) => v === "" || /^234\d{10}$/.test(v), "Use the international format, e.g. 2348031234567"),
  info: z.string().trim().max(6000),
  bookingCapacity: z.coerce.number().int().min(1).max(50),
  bookingDepositPercent: z.coerce.number().int().min(0).max(100),
  deliveryFee: z.coerce.number().min(0).max(100000),
  offersDelivery: z.boolean(),
  offersPickup: z.boolean(),
});

export async function saveSettings(_prev: { error?: string; ok?: boolean } | undefined, form: FormData) {
  const tenant = await requireTenant();
  const parsed = settingsSchema.safeParse({
    name: form.get("name"),
    address: form.get("address"),
    ownerPhone: form.get("ownerPhone") ?? "",
    info: form.get("info"),
    bookingCapacity: form.get("bookingCapacity") ?? tenant.bookingCapacity,
    bookingDepositPercent: form.get("bookingDepositPercent") ?? tenant.bookingDepositPercent,
    deliveryFee: form.get("deliveryFee") ?? tenant.deliveryFeeKobo / 100,
    offersDelivery: form.get("offersDelivery") === "on",
    offersPickup: form.get("offersPickup") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };

  const days: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const hours = {} as OpeningHours;
  for (const day of days) {
    const open = String(form.get(`${day}-open`) ?? "");
    const close = String(form.get(`${day}-close`) ?? "");
    const closed = form.get(`${day}-closed`) === "on";
    if (closed || !open || !close) hours[day] = null;
    else if (open >= close) return { error: `Opening time must be before closing time on ${day}.` };
    else hours[day] = [open, close];
  }

  const v = parsed.data;
  const db = await getDb();
  await db
    .update(tenants)
    .set({
      name: v.name,
      address: v.address,
      ownerPhone: v.ownerPhone || null,
      info: v.info,
      bookingCapacity: v.bookingCapacity,
      bookingDepositPercent: v.bookingDepositPercent,
      deliveryFeeKobo: koboFromNaira(v.deliveryFee),
      offersDelivery: v.offersDelivery,
      offersPickup: v.offersPickup,
      openingHours: hours,
    })
    .where(eq(tenants.id, tenant.id));
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300),
  price: z.coerce.number().positive().max(10_000_000),
  durationMinutes: z.coerce.number().int().min(5).max(720).optional(),
  available: z.boolean(),
});

export async function saveItem(form: FormData) {
  const tenant = await requireTenant();
  const isService = tenant.kind !== "food";
  const parsed = itemSchema.safeParse({
    id: form.get("id") || undefined,
    name: form.get("name"),
    description: form.get("description") ?? "",
    price: form.get("price"),
    durationMinutes: isService ? form.get("durationMinutes") || 60 : undefined,
    available: form.get("available") === "on",
  });
  if (!parsed.success) return;
  const v = parsed.data;
  const db = await getDb();
  const values = {
    name: v.name,
    description: v.description,
    priceKobo: koboFromNaira(v.price),
    durationMinutes: isService ? (v.durationMinutes ?? 60) : null,
    available: v.available,
  };
  if (v.id) {
    await db.update(catalogItems).set(values).where(and(eq(catalogItems.id, v.id), eq(catalogItems.tenantId, tenant.id)));
  } else {
    await db.insert(catalogItems).values({ ...values, tenantId: tenant.id, kind: isService ? "service" : "product", sortOrder: 999 });
  }
  revalidatePath("/dashboard/settings");
}

export async function deleteItem(itemId: string) {
  const tenant = await requireTenant();
  const db = await getDb();
  await db.delete(catalogItems).where(and(eq(catalogItems.id, itemId), eq(catalogItems.tenantId, tenant.id)));
  revalidatePath("/dashboard/settings");
}

/** The simulator: chat as a customer without WhatsApp. Nothing is sent to Meta. */
export async function simulateMessage(phone: string, form: FormData) {
  const text = String(form.get("text") ?? "").trim();
  if (!text || !/^sim\d{6,12}$/.test(phone)) return;
  const tenant = await requireTenant();
  const db = await getDb();
  await handleInbound(
    db,
    {
      phoneNumberId: tenant.whatsappPhoneNumberId,
      from: phone,
      profileName: "Test customer",
      id: `sim.${crypto.randomUUID()}`,
      timestamp: new Date(),
      text,
      readable: true,
    },
    { simulated: true },
  );
  revalidatePath("/dashboard/simulator");
}

export async function newSimulatorChat() {
  await requireTenant();
  redirect(`/dashboard/simulator?as=sim${Math.floor(100000 + Math.random() * 900000)}`);
}
