import { and, count, eq, ne, sql } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { cohorts, courses, discountCodes, enrolments, payments, users, type users as usersTable } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { env, url } from "@/lib/env";
import { naira, shortCode } from "@/lib/money";
import { initializeTransaction } from "@/lib/paystack";
import { formatDateTime } from "@/lib/time";

type User = typeof usersTable.$inferSelect;

export async function seatsTaken(db: Database, cohortId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(enrolments)
    .where(and(eq(enrolments.cohortId, cohortId), eq(enrolments.status, "active")));
  return value;
}

/** The price after a discount code, or an error message for a bad code. */
export async function priceFor(db: Database, courseId: string, priceKobo: number, rawCode: string | null | undefined) {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return { amountKobo: priceKobo, code: null as string | null };
  const discount = await db.query.discountCodes.findFirst({ where: eq(discountCodes.code, code) });
  const usable =
    discount &&
    discount.active &&
    (!discount.courseId || discount.courseId === courseId) &&
    (discount.maxUses === null || discount.uses < discount.maxUses);
  if (!usable) return { error: "That discount code isn't valid for this course." };
  const amountKobo = Math.round((priceKobo * (100 - Math.min(100, Math.max(0, discount.percentOff)))) / 100);
  return { amountKobo, code };
}

export type CheckoutResult = { redirectTo: string } | { error: string };

/** Creates the pending enrolment and payment, then hands back where the student should pay. */
export async function startCheckout(db: Database, user: User, cohortId: string, discount: string | null): Promise<CheckoutResult> {
  const cohort = await db.query.cohorts.findFirst({ where: eq(cohorts.id, cohortId) });
  if (!cohort) return { error: "That intake doesn't exist." };
  const course = (await db.query.courses.findFirst({ where: eq(courses.id, cohort.courseId) }))!;
  if (!cohort.enrolmentOpen || !course.published) return { error: "Enrolment for this intake is closed." };

  const existing = await db.query.enrolments.findFirst({
    where: and(eq(enrolments.userId, user.id), eq(enrolments.cohortId, cohortId)),
  });
  if (existing?.status === "active") return { redirectTo: `/learn/${cohortId}` };
  if ((await seatsTaken(db, cohortId)) >= cohort.capacity) return { error: "Sorry, this intake is full. Try the next one." };

  const price = await priceFor(db, course.id, course.priceKobo, discount);
  if ("error" in price) return { error: price.error ?? "Invalid code." };

  const enrolment =
    existing ??
    (await db.insert(enrolments).values({ userId: user.id, cohortId, status: "pending" }).returning())[0];
  if (existing && existing.status === "cancelled") {
    await db.update(enrolments).set({ status: "pending" }).where(eq(enrolments.id, existing.id));
  }

  // A 100% discount needs no payment.
  if (price.amountKobo === 0) {
    const reference = shortCode("ACD", 8);
    await db.insert(payments).values({
      reference,
      enrolmentId: enrolment.id,
      amountKobo: 0,
      listPriceKobo: course.priceKobo,
      discountCode: price.code,
      provider: "test",
    });
    await markPaymentSuccessful(db, reference);
    return { redirectTo: `/learn/${cohortId}?welcome=1` };
  }

  const reference = shortCode("ACD", 8);
  const provider = env.paystackSecretKey ? "paystack" : "test";
  // Older unpaid attempts are replaced by this one.
  await db
    .update(payments)
    .set({ status: "failed" })
    .where(and(eq(payments.enrolmentId, enrolment.id), eq(payments.status, "pending")));
  await db.insert(payments).values({
    reference,
    enrolmentId: enrolment.id,
    amountKobo: price.amountKobo,
    listPriceKobo: course.priceKobo,
    discountCode: price.code,
    provider,
  });

  if (provider === "test") return { redirectTo: `/pay/test/${reference}` };
  try {
    const { authorizationUrl } = await initializeTransaction({
      email: user.email,
      amountKobo: price.amountKobo,
      reference,
      callbackUrl: url(`/pay/done?reference=${reference}`),
      metadata: { course: course.title, cohort: cohort.name, student: user.name },
    });
    return { redirectTo: authorizationUrl };
  } catch (err) {
    console.error("[paystack] initialize failed", err);
    return { error: "We couldn't reach Paystack. Please try again in a minute." };
  }
}

/** Activates the enrolment for a successful payment. Safe to call more than once. */
export async function markPaymentSuccessful(db: Database, reference: string, check?: { amountKobo: number }) {
  const payment = await db.query.payments.findFirst({ where: eq(payments.reference, reference) });
  if (!payment || payment.status === "success") return payment ?? null;
  if (check && check.amountKobo < payment.amountKobo) {
    console.error("[payments] amount mismatch", reference, check.amountKobo, payment.amountKobo);
    return null;
  }
  const now = new Date();
  // Only the first caller flips the status, so the receipt goes out once.
  const flipped = await db
    .update(payments)
    .set({ status: "success", paidAt: now })
    .where(and(eq(payments.reference, reference), ne(payments.status, "success")))
    .returning();
  if (!flipped.length) return payment;

  const [enrolment] = await db
    .update(enrolments)
    .set({ status: "active", enrolledAt: now })
    .where(eq(enrolments.id, payment.enrolmentId))
    .returning();
  if (payment.discountCode) {
    await db
      .update(discountCodes)
      .set({ uses: sql`${discountCodes.uses} + 1` })
      .where(eq(discountCodes.code, payment.discountCode));
  }

  const user = (await db.query.users.findFirst({ where: eq(users.id, enrolment.userId) }))!;
  const cohort = (await db.query.cohorts.findFirst({ where: eq(cohorts.id, enrolment.cohortId) }))!;
  const course = (await db.query.courses.findFirst({ where: eq(courses.id, cohort.courseId) }))!;
  const firstClass = await db.query.classes.findFirst({
    where: (c, { eq }) => eq(c.cohortId, cohort.id),
    orderBy: (c, { asc }) => asc(c.startsAt),
  });
  await sendEmail(db, {
    to: user.email,
    subject: `You're enrolled: ${course.title}`,
    body: [
      `Hi ${user.name},`,
      "",
      `Welcome to ${course.title} (${cohort.name} intake). Your payment of ${naira(payment.amountKobo)} was received. Reference: ${reference}.`,
      firstClass ? `Your first live class is ${formatDateTime(firstClass.startsAt)} (Lagos time).` : "",
      `Your class timetable, notes and AI tutor are here: ${url(`/learn/${cohort.id}`)}`,
      "",
      "See you in class,",
      "Jules, JTR Academy",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
  return { ...payment, status: "success" as const };
}
