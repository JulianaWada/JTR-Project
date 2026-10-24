import type Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { availableTimes, BookingError, createBooking, customerBookings, describeBooking, getService } from "@/lib/bookings";
import type { Database } from "@/lib/db";
import { bookings, customers, orders, type CatalogItem, type Customer, type Tenant } from "@/lib/db/schema";
import { alertOwner } from "@/lib/messaging";
import { naira } from "@/lib/money";
import { createOrder, customerOrders, describeOrder, OrderError } from "@/lib/orders";
import { getPaymentLink, paymentLinkMessage } from "@/lib/payments";
import { formatLagos } from "@/lib/time";

export type ToolContext = {
  db: Database;
  tenant: Tenant;
  customer: Customer;
  items: CatalogItem[];
  now: Date;
  /** Messages the system sends after the agent's reply, such as payment links. */
  followUps: string[];
  handedOver: boolean;
};

type ToolDef = {
  definition: Anthropic.Beta.BetaTool;
  input: z.ZodType;
  run: (input: never, ctx: ToolContext) => Promise<unknown>;
};

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const HH_MM = z.string().regex(/^\d{1,2}:\d{2}$/, "Use 24-hour HH:MM");

const checkAvailability = {
  definition: {
    name: "check_availability",
    description:
      "List the free start times for one service on one date. Call this before offering times or creating a booking.",
    input_schema: {
      type: "object",
      properties: {
        service_id: { type: "string", description: "The id of the service from the services list." },
        date: { type: "string", description: "The date in YYYY-MM-DD, Lagos time." },
      },
      required: ["service_id", "date"],
      additionalProperties: false,
    },
  },
  input: z.object({ service_id: z.string(), date: ISO_DATE }),
  run: async (input: { service_id: string; date: string }, ctx: ToolContext) => {
    const item = await getService(ctx.db, ctx.tenant, input.service_id);
    const result = await availableTimes(ctx.db, ctx.tenant, item, input.date, ctx.now);
    if (!result.open) return { service: item.name, date: input.date, closed: true };
    return {
      service: item.name,
      date: input.date,
      opening_hours: `${result.hours[0]}–${result.hours[1]}`,
      free_start_times_24h: result.times,
      note: result.times.length ? undefined : "Fully booked or too late in the day. Suggest another day.",
    };
  },
};

const createBookingTool = {
  definition: {
    name: "create_booking",
    description:
      "Book an appointment after the customer has confirmed the service, date, time and their name. If a deposit is needed, the payment link is sent automatically after your reply.",
    input_schema: {
      type: "object",
      properties: {
        service_id: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD, Lagos time." },
        time: { type: "string", description: "Start time in 24-hour HH:MM, one of the free times from check_availability." },
        customer_name: { type: "string", description: "The name the booking is under." },
        notes: { type: "string", description: "Anything the stylist should know (optional)." },
      },
      required: ["service_id", "date", "time", "customer_name"],
      additionalProperties: false,
    },
  },
  input: z.object({
    service_id: z.string(),
    date: ISO_DATE,
    time: HH_MM,
    customer_name: z.string().min(1).max(80),
    notes: z.string().max(500).optional(),
  }),
  run: async (
    input: { service_id: string; date: string; time: string; customer_name: string; notes?: string },
    ctx: ToolContext,
  ) => {
    const time = input.time.padStart(5, "0");
    const booking = await createBooking(
      ctx.db,
      ctx.tenant,
      ctx.customer,
      { itemId: input.service_id, date: input.date, time, customerName: input.customer_name, notes: input.notes },
      ctx.now,
    );
    await ctx.db.update(customers).set({ name: booking.customerName }).where(eq(customers.id, ctx.customer.id));
    if (booking.status === "pending_payment") {
      const payment = await getPaymentLink(ctx.db, ctx.tenant, ctx.customer, { booking });
      ctx.followUps.push(paymentLinkMessage(payment, { booking }));
      return {
        booking_code: booking.code,
        status: "held until the deposit is paid (1 hour)",
        summary: describeBooking(booking),
        price: naira(booking.priceKobo),
        deposit_due: naira(booking.depositKobo),
        payment_link: "will be sent automatically right after your reply",
      };
    }
    await alertOwner(ctx.tenant, `New booking ${booking.code}: ${booking.serviceName}, ${formatLagos(booking.startsAt)}.`, booking.customerName);
    return { booking_code: booking.code, status: "confirmed", summary: describeBooking(booking), price: naira(booking.priceKobo) };
  },
};

const cancelBookingTool = {
  definition: {
    name: "cancel_booking",
    description: "Cancel one of this customer's upcoming bookings by its code.",
    input_schema: {
      type: "object",
      properties: { booking_code: { type: "string" } },
      required: ["booking_code"],
      additionalProperties: false,
    },
  },
  input: z.object({ booking_code: z.string() }),
  run: async (input: { booking_code: string }, ctx: ToolContext) => {
    const code = input.booking_code.trim().toUpperCase();
    const booking = await ctx.db.query.bookings.findFirst({
      where: and(eq(bookings.code, code), eq(bookings.customerId, ctx.customer.id)),
    });
    if (!booking || !["pending_payment", "confirmed"].includes(booking.status)) {
      return { error: "No upcoming booking with that code for this customer." };
    }
    await ctx.db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, booking.id));
    const paid = booking.status === "confirmed" && booking.depositKobo > 0;
    await alertOwner(
      ctx.tenant,
      `Booking ${booking.code} (${booking.serviceName}, ${formatLagos(booking.startsAt)}) was cancelled by the customer.${paid ? ` A ${naira(booking.depositKobo)} deposit was paid: check the refund policy.` : ""}`,
      booking.customerName,
    );
    return {
      cancelled: describeBooking(booking),
      deposit_paid: paid ? naira(booking.depositKobo) : null,
      note: paid ? "Refunds are handled by the team, who have been told." : undefined,
    };
  },
};

const createOrderTool = {
  definition: {
    name: "create_order",
    description:
      "Place a food order after the customer has confirmed the items, quantities, delivery or pickup and (for delivery) the address. The payment link is sent automatically after your reply.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_id: { type: "string", description: "The id of the item from the menu." },
              quantity: { type: "integer", minimum: 1 },
            },
            required: ["item_id", "quantity"],
            additionalProperties: false,
          },
        },
        fulfilment: { type: "string", enum: ["delivery", "pickup"] },
        delivery_address: { type: "string", description: "Full address with area and landmark. Required for delivery." },
        notes: { type: "string", description: "Extra instructions, e.g. less pepper (optional)." },
      },
      required: ["items", "fulfilment"],
      additionalProperties: false,
    },
  },
  input: z.object({
    items: z.array(z.object({ item_id: z.string(), quantity: z.number().int() })).min(1).max(20),
    fulfilment: z.enum(["delivery", "pickup"]),
    delivery_address: z.string().max(300).optional(),
    notes: z.string().max(500).optional(),
  }),
  run: async (
    input: { items: { item_id: string; quantity: number }[]; fulfilment: "delivery" | "pickup"; delivery_address?: string; notes?: string },
    ctx: ToolContext,
  ) => {
    const order = await createOrder(
      ctx.db,
      ctx.tenant,
      ctx.customer,
      {
        items: input.items.map((i) => ({ itemId: i.item_id, quantity: i.quantity })),
        fulfilment: input.fulfilment,
        deliveryAddress: input.delivery_address,
        notes: input.notes,
      },
      ctx.now,
    );
    const payment = await getPaymentLink(ctx.db, ctx.tenant, ctx.customer, { order });
    ctx.followUps.push(paymentLinkMessage(payment, { order }));
    return {
      order_code: order.code,
      summary: describeOrder(order),
      total: naira(order.totalKobo),
      payment_link: "will be sent automatically right after your reply",
    };
  },
};

const lookupTool = {
  definition: {
    name: "get_my_orders_and_bookings",
    description: "Look up this customer's recent orders and upcoming bookings, with their payment status.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  input: z.object({}),
  run: async (_input: Record<string, never>, ctx: ToolContext) => {
    const [o, b] = await Promise.all([customerOrders(ctx.db, ctx.customer), customerBookings(ctx.db, ctx.customer)]);
    return {
      orders: o.map(describeOrder),
      upcoming_bookings: b.map((x) => `${describeBooking(x)}, ${x.status === "confirmed" ? "confirmed" : `waiting for a ${naira(x.depositKobo)} deposit`}`),
    };
  },
};

const resendLinkTool = {
  definition: {
    name: "resend_payment_link",
    description: "Send the payment link again for an unpaid order or booking, by its code.",
    input_schema: {
      type: "object",
      properties: { code: { type: "string", description: "The order or booking code." } },
      required: ["code"],
      additionalProperties: false,
    },
  },
  input: z.object({ code: z.string() }),
  run: async (input: { code: string }, ctx: ToolContext) => {
    const code = input.code.trim().toUpperCase();
    const order = await ctx.db.query.orders.findFirst({ where: and(eq(orders.code, code), eq(orders.customerId, ctx.customer.id)) });
    if (order) {
      if (order.status !== "awaiting_payment") return { error: `Order ${code} is ${order.status.replaceAll("_", " ")}; no payment is due.` };
      const payment = await getPaymentLink(ctx.db, ctx.tenant, ctx.customer, { order });
      ctx.followUps.push(paymentLinkMessage(payment, { order }));
      return { ok: true, payment_link: "will be sent automatically right after your reply" };
    }
    const booking = await ctx.db.query.bookings.findFirst({ where: and(eq(bookings.code, code), eq(bookings.customerId, ctx.customer.id)) });
    if (booking) {
      if (booking.status !== "pending_payment") return { error: `Booking ${code} is ${booking.status.replaceAll("_", " ")}; no payment is due.` };
      const payment = await getPaymentLink(ctx.db, ctx.tenant, ctx.customer, { booking });
      ctx.followUps.push(paymentLinkMessage(payment, { booking }));
      return { ok: true, payment_link: "will be sent automatically right after your reply" };
    }
    return { error: "No order or booking with that code for this customer." };
  },
};

const handoverTool = {
  definition: {
    name: "handover_to_human",
    description:
      "Pass the chat to the business's team. You stop replying until they hand it back. Use when the customer asks for a person, complains, wants a refund or discount, or asks something you can't answer.",
    input_schema: {
      type: "object",
      properties: { reason: { type: "string", description: "One short sentence for the team about what the customer needs." } },
      required: ["reason"],
      additionalProperties: false,
    },
  },
  input: z.object({ reason: z.string().min(1).max(300) }),
  run: async (input: { reason: string }, ctx: ToolContext) => {
    await handOver(ctx.db, ctx.tenant, ctx.customer, input.reason);
    ctx.handedOver = true;
    return { ok: true, note: "The team has been alerted. Tell the customer someone will reply here soon." };
  },
};

export async function handOver(db: Database, tenant: Tenant, customer: Customer, reason: string) {
  await db
    .update(customers)
    .set({ mode: "human", needsAttention: true, handoverReason: reason })
    .where(eq(customers.id, customer.id));
  await alertOwner(tenant, `Needs a person: ${reason}`, customer.name ?? customer.profileName ?? customer.waId);
}

const ALL_TOOLS: ToolDef[] = [
  checkAvailability,
  createBookingTool,
  cancelBookingTool,
  createOrderTool,
  lookupTool,
  resendLinkTool,
  handoverTool,
] as ToolDef[];

const BOOKING_TOOLS = new Set(["check_availability", "create_booking", "cancel_booking"]);
const ORDER_TOOLS = new Set(["create_order"]);

/** The tools that make sense for this business. The set is fixed per business so the prompt cache holds. */
export function toolsFor(tenant: Tenant): ToolDef[] {
  return ALL_TOOLS.filter((t) => {
    const name = t.definition.name;
    if (tenant.kind === "food") return !BOOKING_TOOLS.has(name);
    if (tenant.kind === "salon") return !ORDER_TOOLS.has(name);
    return true;
  });
}

/** Runs one tool call. Errors become readable messages for the model instead of crashing the chat. */
export async function runTool(name: string, rawInput: unknown, ctx: ToolContext): Promise<{ content: string; isError: boolean }> {
  const tool = toolsFor(ctx.tenant).find((t) => t.definition.name === name);
  if (!tool) return { content: `Unknown tool ${name}.`, isError: true };
  const parsed = tool.input.safeParse(rawInput);
  if (!parsed.success) {
    return { content: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`, isError: true };
  }
  try {
    const result = await tool.run(parsed.data as never, ctx);
    return { content: JSON.stringify(result), isError: false };
  } catch (err) {
    if (err instanceof BookingError || err instanceof OrderError) return { content: err.message, isError: true };
    console.error(`[agent] tool ${name} failed`, err);
    return { content: "Something went wrong on our side. Apologise and hand the chat to a person.", isError: true };
  }
}
