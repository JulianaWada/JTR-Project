import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { getDb, schema } from "@/lib/db";
import { markPaymentSuccessful } from "@/lib/enrolment";
import { verifyTransaction } from "@/lib/paystack";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };

/** Where Paystack sends students after paying. The webhook usually got here first. */
export default async function PaymentDone({ searchParams }: PageProps<"/pay/done">) {
  const { reference } = await searchParams;
  const db = await getDb();
  const ref = typeof reference === "string" ? reference : "";
  let payment = ref ? await db.query.payments.findFirst({ where: eq(schema.payments.reference, ref) }) : undefined;

  if (payment && payment.status === "pending" && payment.provider === "paystack") {
    try {
      const tx = await verifyTransaction(ref);
      if (tx.status === "success" && tx.currency === "NGN") {
        await markPaymentSuccessful(db, ref, { amountKobo: tx.amountKobo });
        payment = await db.query.payments.findFirst({ where: eq(schema.payments.reference, ref) });
      }
    } catch (err) {
      console.error("[paystack] verify on return failed", err);
    }
  }
  const enrolment = payment ? await db.query.enrolments.findFirst({ where: eq(schema.enrolments.id, payment.enrolmentId) }) : undefined;
  const ok = payment?.status === "success" && enrolment;

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="card">
        <p className="text-5xl" aria-hidden>
          {ok ? "🎉" : "⏳"}
        </p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{ok ? "You're enrolled!" : "We're confirming your payment"}</h1>
        <p className="mt-2 text-muted">
          {ok
            ? "Your receipt and class timetable are on their way to your email. Your first badge is waiting at your first class."
            : "This can take a minute. Refresh this page, or check your dashboard shortly. If money left your account and nothing changes, contact us with your reference."}
        </p>
        {ref && <p className="mt-2 text-xs text-muted">Reference {ref}</p>}
        <Link href={ok ? `/learn/${enrolment.cohortId}?welcome=1` : "/learn"} className="btn-primary mt-6 w-full">
          Go to my course
        </Link>
      </div>
    </div>
  );
}
