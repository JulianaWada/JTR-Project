import { getDb } from "@/lib/db";
import { markPaymentRefunded, markPaymentSuccessful } from "@/lib/enrolment";
import { env } from "@/lib/env";
import { verifyPaystackSignature, verifyTransaction } from "@/lib/paystack";

export const maxDuration = 30;

// Set this URL in Paystack: Settings > API Keys & Webhooks > Webhook URL = <site>/academy/api/paystack/webhook
export async function POST(request: Request) {
  const key = env.paystackSecretKey;
  if (!key) return new Response("Not configured", { status: 503 });
  const raw = await request.text();
  if (!verifyPaystackSignature(raw, request.headers.get("x-paystack-signature"), key)) {
    return new Response("Invalid signature", { status: 401 });
  }
  const event = JSON.parse(raw) as {
    event?: string;
    data?: { reference?: string; transaction_reference?: string; transaction?: { reference?: string }; amount?: number | string };
  };

  // A full refund takes the course away again.
  if (event.event === "refund.processed") {
    const reference = event.data?.transaction_reference ?? event.data?.transaction?.reference;
    const amount = Number(event.data?.amount);
    if (!reference || !Number.isFinite(amount)) return new Response("Ignored", { status: 200 });
    try {
      await markPaymentRefunded(await getDb(), reference, amount);
    } catch (err) {
      console.error("[paystack] refund handling failed", err);
      return new Response("Error", { status: 500 });
    }
    return new Response("OK", { status: 200 });
  }

  if (event.event !== "charge.success" || !event.data?.reference) return new Response("Ignored", { status: 200 });

  try {
    // Confirm with Paystack directly rather than trusting the webhook body alone.
    const tx = await verifyTransaction(event.data.reference);
    if (tx.status === "success") {
      await markPaymentSuccessful(await getDb(), event.data.reference, { amountKobo: tx.amountKobo, currency: tx.currency });
    }
  } catch (err) {
    console.error("[paystack] webhook handling failed", err);
    // A 500 makes Paystack retry later.
    return new Response("Error", { status: 500 });
  }
  return new Response("OK", { status: 200 });
}
