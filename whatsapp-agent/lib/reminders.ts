import { and, eq, gt, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import { UNPAID_HOLD_MS } from "@/lib/bookings";
import type { Database } from "@/lib/db";
import { agentTurns, bookings, customers, messages, orders, payments, tenants, type Customer, type Tenant } from "@/lib/db/schema";
import { sendToCustomer } from "@/lib/messaging";
import { naira } from "@/lib/money";
import { formatLagos } from "@/lib/time";

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const ORDER_PAYMENT_NUDGE_AFTER = 20 * MINUTE;
const ORDER_EXPIRES_AFTER = 2 * HOUR;

async function load(db: Database, tenantId: string, customerId: string): Promise<[Tenant, Customer]> {
  const [tenant, customer] = await Promise.all([
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
    db.query.customers.findFirst({ where: eq(customers.id, customerId) }),
  ]);
  return [tenant!, customer!];
}

/**
 * Runs every few minutes from a cron job: appointment reminders, payment nudges and releasing
 * unpaid holds. Each step marks what it did, so running it twice sends nothing twice.
 */
export async function runReminders(db: Database, now = new Date()) {
  const summary = { dayBefore: 0, sameDay: 0, bookingsExpired: 0, orderNudges: 0, ordersExpired: 0 };

  // 1. Day-before reminders, for bookings made more than a day ahead.
  const dayBefore = await db.query.bookings.findMany({
    where: and(
      eq(bookings.status, "confirmed"),
      isNull(bookings.reminderDayBeforeSentAt),
      lte(bookings.startsAt, new Date(now.getTime() + 24 * HOUR)),
      gt(bookings.startsAt, new Date(now.getTime() + 3 * HOUR)),
      lt(bookings.createdAt, sql`${bookings.startsAt} - interval '24 hours'`),
    ),
  });
  for (const b of dayBefore) {
    await db.update(bookings).set({ reminderDayBeforeSentAt: now }).where(eq(bookings.id, b.id));
    const [tenant, customer] = await load(db, b.tenantId, b.customerId);
    if (customer.optedOut) continue;
    const when = formatLagos(b.startsAt);
    await sendToCustomer(
      db,
      tenant,
      customer,
      `Hi ${b.customerName}, a reminder of your ${b.serviceName} at ${tenant.name} on ${when}. 📍 ${tenant.address}\n\nNeed to change it? Just reply here.`,
      { author: "system", now, template: { name: "booking_reminder", params: [b.customerName, b.serviceName, tenant.name, when] } },
    );
    summary.dayBefore++;
  }

  // 2. Same-day reminders, two hours before.
  const sameDay = await db.query.bookings.findMany({
    where: and(
      eq(bookings.status, "confirmed"),
      isNull(bookings.reminderSameDaySentAt),
      lte(bookings.startsAt, new Date(now.getTime() + 2 * HOUR)),
      gt(bookings.startsAt, now),
      lt(bookings.createdAt, sql`${bookings.startsAt} - interval '3 hours'`),
    ),
  });
  for (const b of sameDay) {
    await db.update(bookings).set({ reminderSameDaySentAt: now }).where(eq(bookings.id, b.id));
    const [tenant, customer] = await load(db, b.tenantId, b.customerId);
    if (customer.optedOut) continue;
    const when = formatLagos(b.startsAt, { withDate: false });
    await sendToCustomer(
      db,
      tenant,
      customer,
      `See you soon, ${b.customerName}! Your ${b.serviceName} at ${tenant.name} is today at ${when}.`,
      { author: "system", now, template: { name: "booking_reminder", params: [b.customerName, b.serviceName, tenant.name, `today at ${when}`] } },
    );
    summary.sameDay++;
  }

  // 3. Release booking slots whose deposit was never paid.
  const expiredBookings = await db
    .update(bookings)
    .set({ status: "expired" })
    .where(and(eq(bookings.status, "pending_payment"), lt(bookings.createdAt, new Date(now.getTime() - UNPAID_HOLD_MS))))
    .returning();
  for (const b of expiredBookings) {
    await db.update(payments).set({ status: "abandoned" }).where(and(eq(payments.bookingId, b.id), eq(payments.status, "pending")));
    const [tenant, customer] = await load(db, b.tenantId, b.customerId);
    await sendToCustomer(
      db,
      tenant,
      customer,
      `The ${b.serviceName} slot on ${formatLagos(b.startsAt)} has been released because the deposit wasn't paid. Message us any time to book again.`,
      { author: "system", now },
    );
    summary.bookingsExpired++;
  }

  // 4. Nudge unpaid orders once, then expire them.
  const unpaid = await db.query.orders.findMany({
    where: and(
      eq(orders.status, "awaiting_payment"),
      isNull(orders.paymentReminderSentAt),
      lt(orders.createdAt, new Date(now.getTime() - ORDER_PAYMENT_NUDGE_AFTER)),
      gt(orders.createdAt, new Date(now.getTime() - ORDER_EXPIRES_AFTER)),
    ),
  });
  for (const o of unpaid) {
    await db.update(orders).set({ paymentReminderSentAt: now }).where(eq(orders.id, o.id));
    const [tenant, customer] = await load(db, o.tenantId, o.customerId);
    const payment = await db.query.payments.findFirst({ where: and(eq(payments.orderId, o.id), eq(payments.status, "pending")) });
    if (!payment) continue;
    await sendToCustomer(
      db,
      tenant,
      customer,
      `Just checking: your order ${o.code} (${naira(o.totalKobo)}) is waiting for payment. We start cooking as soon as it's paid:\n${payment.authorizationUrl}`,
      { author: "system", now },
    );
    summary.orderNudges++;
  }

  const expiredOrders = await db
    .update(orders)
    .set({ status: "expired" })
    .where(and(eq(orders.status, "awaiting_payment"), lt(orders.createdAt, new Date(now.getTime() - ORDER_EXPIRES_AFTER))))
    .returning({ id: orders.id });
  if (expiredOrders.length) {
    await db
      .update(payments)
      .set({ status: "abandoned" })
      .where(and(inArray(payments.orderId, expiredOrders.map((o) => o.id)), eq(payments.status, "pending")));
  }
  summary.ordersExpired = expiredOrders.length;

  // 5. Data retention promised in the privacy notice: chats are kept for 12 months.
  const cutoff = new Date(now.getTime() - 365 * 24 * HOUR);
  await db.delete(messages).where(lt(messages.createdAt, cutoff));
  await db.delete(agentTurns).where(lt(agentTurns.createdAt, cutoff));

  return summary;
}
