import { and, eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import {
  bookings,
  customers,
  orders,
  payments,
  tenants,
  type Booking,
  type Customer,
  type Order,
  type Payment,
  type Tenant,
} from "@/lib/db/schema";
import { env, modes } from "@/lib/env";
import { alertOwner, sendToCustomer } from "@/lib/messaging";
import { naira, shortCode } from "@/lib/money";
import { initializeTransaction } from "@/lib/paystack";
import { formatLagos } from "@/lib/time";

export type Payable = { order: Order } | { booking: Booking };

function amountOf(p: Payable) {
  return "order" in p ? p.order.totalKobo : p.booking.depositKobo;
}

/** Creates (or reuses) a payment link for an order or a booking deposit. */
export async function getPaymentLink(db: Database, tenant: Tenant, customer: Customer, payable: Payable): Promise<Payment> {
  const target: { orderId: string } | { bookingId: string } =
    "order" in payable ? { orderId: payable.order.id } : { bookingId: payable.booking.id };
  const existing = await db.query.payments.findFirst({
    where: and(
      eq(payments.status, "pending"),
      "order" in payable ? eq(payments.orderId, payable.order.id) : eq(payments.bookingId, payable.booking.id),
    ),
  });
  if (existing) return existing;

  const amountKobo = amountOf(payable);
  const reference = shortCode("JTR", 10);
  let authorizationUrl: string;
  let provider: Payment["provider"];
  if (modes().paystack === "live" && !customer.simulated) {
    ({ authorizationUrl } = await initializeTransaction({
      email: `wa${customer.waId}@${env.paystackEmailDomain}`,
      amountKobo,
      reference,
      callbackUrl: `${env.appUrl}/pay/done`,
      subaccount: tenant.paystackSubaccount,
      metadata: { tenant: tenant.slug, customer_phone: customer.waId, ...target },
    }));
    provider = "paystack";
  } else {
    authorizationUrl = `${env.appUrl}/pay/test/${reference}`;
    provider = "mock";
  }

  const [payment] = await db
    .insert(payments)
    .values({ tenantId: tenant.id, customerId: customer.id, ...target, reference, amountKobo, provider, status: "pending", authorizationUrl })
    .returning();
  return payment;
}

export function paymentLinkMessage(payment: Payment, payable: Payable) {
  const what =
    "order" in payable
      ? `your order ${payable.order.code}`
      : `the deposit for your booking ${payable.booking.code}`;
  const secured = payment.provider === "paystack" ? "The link is secured by Paystack. " : "(Test payment link: no real money is taken.) ";
  return `💳 Pay ${naira(payment.amountKobo)} for ${what} here:\n${payment.authorizationUrl}\n\n${secured}You'll get a confirmation here once payment is received.`;
}

/**
 * Called once a payment is confirmed (Paystack webhook, the payment page's return, or the test page).
 * Safe to call more than once for the same payment.
 */
export async function markPaymentSuccessful(db: Database, reference: string, opts: { amountKobo?: number; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const [payment] = await db
    .update(payments)
    .set({ status: "success", paidAt: now })
    .where(and(eq(payments.reference, reference), eq(payments.status, "pending")))
    .returning();
  if (!payment) return { alreadyHandled: true as const };
  if (opts.amountKobo !== undefined && opts.amountKobo < payment.amountKobo) {
    // Should never happen with Paystack links, but never confirm an underpayment.
    await db.update(payments).set({ status: "failed" }).where(eq(payments.id, payment.id));
    console.error(`[payments] ${reference} paid ${opts.amountKobo} but ${payment.amountKobo} was due`);
    return { alreadyHandled: false as const, underpaid: true };
  }

  const tenant = (await db.query.tenants.findFirst({ where: eq(tenants.id, payment.tenantId) }))!;
  const customer = (await db.query.customers.findFirst({ where: eq(customers.id, payment.customerId) }))!;

  if (payment.orderId) {
    const [order] = await db.update(orders).set({ status: "paid" }).where(eq(orders.id, payment.orderId)).returning();
    const eta = order.fulfilment === "delivery" ? "We'll let you know when it's on the way." : "We'll tell you when it's ready for pickup.";
    await sendToCustomer(
      db,
      tenant,
      customer,
      `✅ Payment of ${naira(payment.amountKobo)} received for order ${order.code}. Thank you! ${eta}`,
      { author: "system", now },
    );
    await alertOwner(tenant, `New paid order ${order.code} (${naira(order.totalKobo)}, ${order.fulfilment}).`, customer.name ?? customer.profileName ?? customer.waId);
  } else if (payment.bookingId) {
    const [booking] = await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, payment.bookingId)).returning();
    await sendToCustomer(
      db,
      tenant,
      customer,
      `✅ Deposit of ${naira(payment.amountKobo)} received. Your ${booking.serviceName} is confirmed for ${formatLagos(booking.startsAt)} (code ${booking.code}). We'll remind you before your appointment.`,
      { author: "system", now },
    );
    await alertOwner(tenant, `New booking ${booking.code}: ${booking.serviceName}, ${formatLagos(booking.startsAt)}.`, booking.customerName);
  }
  return { alreadyHandled: false as const, payment };
}
