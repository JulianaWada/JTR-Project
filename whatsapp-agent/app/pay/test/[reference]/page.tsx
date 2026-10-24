import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { naira } from "@/lib/money";
import { markPaymentSuccessful } from "@/lib/payments";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Test payment" };

async function payNow(reference: string) {
  "use server";
  const db = await getDb();
  const payment = await db.query.payments.findFirst({ where: eq(schema.payments.reference, reference) });
  // Only test-mode payments can be completed from this page.
  if (!payment || payment.provider !== "mock") return;
  await markPaymentSuccessful(db, reference);
  revalidatePath(`/pay/test/${reference}`);
}

export default async function TestCheckout({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const db = await getDb();
  const payment = await db.query.payments.findFirst({ where: eq(schema.payments.reference, reference) });
  if (!payment || payment.provider !== "mock") notFound();
  const tenant = (await db.query.tenants.findFirst({ where: eq(schema.tenants.id, payment.tenantId) }))!;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-sm text-center">
        <p className="pill mx-auto bg-amber-100 text-amber-800">Test checkout · no real money</p>
        <p className="mt-4 text-sm text-slate-500">Pay {tenant.name}</p>
        <p className="text-3xl font-semibold text-navy">{naira(payment.amountKobo)}</p>
        <p className="mt-1 text-xs text-slate-400">Ref {payment.reference}</p>
        {payment.status === "success" ? (
          <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Paid. A confirmation has been sent on WhatsApp.</p>
        ) : payment.status === "pending" ? (
          <form action={payNow.bind(null, reference)} className="mt-6">
            <button className="btn-primary w-full">Pay {naira(payment.amountKobo)} (test)</button>
            <p className="mt-3 text-xs text-slate-500">With a Paystack key set, customers see Paystack&apos;s real checkout here instead.</p>
          </form>
        ) : (
          <p className="mt-6 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">This payment link has expired. Ask for a new one on WhatsApp.</p>
        )}
      </div>
    </main>
  );
}
