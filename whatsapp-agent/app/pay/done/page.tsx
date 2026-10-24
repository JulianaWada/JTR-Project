import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getDb, schema } from "@/lib/db";
import { modes } from "@/lib/env";
import { markPaymentSuccessful } from "@/lib/payments";
import { verifyTransaction } from "@/lib/paystack";

export const metadata: Metadata = { title: "Payment" };

/** Paystack sends customers here after checkout. The webhook usually confirms first; this is a backup. */
export default async function PaymentDone({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;
  let paid = false;
  let whatsapp: string | null = null;
  if (reference && modes().paystack === "live") {
    const db = await getDb();
    const payment = await db.query.payments.findFirst({ where: eq(schema.payments.reference, reference) });
    if (payment) {
      const tenant = await db.query.tenants.findFirst({ where: eq(schema.tenants.id, payment.tenantId) });
      whatsapp = tenant?.whatsappDisplayNumber?.replace(/[^\d]/g, "") ?? null;
      if (payment.status === "success") paid = true;
      else {
        try {
          const tx = await verifyTransaction(reference);
          if (tx.status === "success" && tx.currency === "NGN") {
            await markPaymentSuccessful(db, reference, { amountKobo: tx.amountKobo });
            paid = true;
          }
        } catch (err) {
          console.error("[pay/done] verify failed", err);
        }
      }
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-sm text-center">
        <p className="text-4xl">{paid ? "✅" : "⏳"}</p>
        <h1 className="mt-3 text-xl font-semibold text-navy">{paid ? "Payment received" : "Checking your payment"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {paid ? "Thank you! Your confirmation is on WhatsApp." : "If you completed payment, your confirmation will arrive on WhatsApp in a moment."}
        </p>
        {whatsapp && (
          <a className="btn-primary mt-6 w-full" href={`https://wa.me/${whatsapp}`}>
            Back to WhatsApp
          </a>
        )}
      </div>
    </main>
  );
}
