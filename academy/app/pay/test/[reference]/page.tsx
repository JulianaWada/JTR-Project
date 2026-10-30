import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { markPaymentSuccessful } from "@/lib/enrolment";
import { naira } from "@/lib/money";
import { asset } from "@/lib/assets";

export const metadata: Metadata = { title: "Test payment", robots: { index: false } };

async function payNow(reference: string) {
  "use server";
  const db = await getDb();
  const payment = await db.query.payments.findFirst({ where: eq(schema.payments.reference, reference) });
  // Only test-mode payments can be completed from this page.
  if (!payment || payment.provider !== "test") return;
  await markPaymentSuccessful(db, reference);
  redirect(`/pay/done?reference=${reference}`);
}

/** Stands in for Paystack's checkout until PAYSTACK_SECRET_KEY is set. */
export default async function TestCheckout({ params }: PageProps<"/pay/test/[reference]">) {
  const { reference } = await params;
  const db = await getDb();
  const payment = await db.query.payments.findFirst({ where: eq(schema.payments.reference, reference) });
  if (!payment || payment.provider !== "test") notFound();
  const enrolment = (await db.query.enrolments.findFirst({ where: eq(schema.enrolments.id, payment.enrolmentId) }))!;
  const cohort = (await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, enrolment.cohortId) }))!;
  const course = (await db.query.courses.findFirst({ where: eq(schema.courses.id, cohort.courseId) }))!;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4">
      <div className="card w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/brand/jtr-emblem.png")} alt="" width={48} height={48} className="mx-auto" />
        <p className="pill mx-auto mt-4 bg-warning-soft text-warning">Test checkout · no real money</p>
        <p className="mt-4 text-sm text-muted">
          {course.title} · {cohort.name}
        </p>
        <p className="font-display text-4xl font-semibold text-ink">{naira(payment.amountKobo)}</p>
        {payment.discountCode && (
          <p className="mt-1 text-xs text-success">
            Code {payment.discountCode} applied (was {naira(payment.listPriceKobo)})
          </p>
        )}
        <p className="mt-1 text-xs text-muted">Ref {payment.reference}</p>
        {payment.status === "success" ? (
          <p className="mt-6 rounded-xl bg-success-soft p-3 text-sm text-success">Paid. You&apos;re enrolled.</p>
        ) : payment.status === "pending" ? (
          <form action={payNow.bind(null, reference)} className="mt-6">
            <button className="btn-primary w-full">Pay {naira(payment.amountKobo)} (test)</button>
            <p className="mt-3 text-xs text-muted">With a Paystack key set, students see Paystack&apos;s real checkout here instead.</p>
          </form>
        ) : (
          <p className="mt-6 rounded-xl bg-surface-2 p-3 text-sm text-muted">This payment link has expired. Start again from the course page.</p>
        )}
      </div>
    </main>
  );
}
