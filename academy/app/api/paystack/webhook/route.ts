import { getDb } from "@/lib/db";
import { markPaymentSuccessful } from "@/lib/enrolment";
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
  const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  if (event.event !== "charge.success" || !event.data?.reference) return new Response("Ignored", { status: 200 });

  try {
    // Confirm with Paystack directly rather than trusting the webhook body alone.
    const tx = await verifyTransaction(event.data.reference);
    if (tx.status === "success" && tx.currency === "NGN") {
      await markPaymentSuccessful(await getDb(), event.data.reference, { amountKobo: tx.amountKobo });
    }
  } catch (err) {
    console.error("[paystack] webhook handling failed", err);
    // A 500 makes Paystack retry later.
    return new Response("Error", { status: 500 });
  }
  return new Response("OK", { status: 200 });
}
