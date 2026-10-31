import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// Paystack: https://paystack.com/docs/api/transaction/

const API = "https://api.paystack.co";

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = env.paystackSecretKey;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers },
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(`Paystack ${path} failed: ${json.message ?? res.status}`);
  }
  return json.data;
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  subaccount?: string | null;
  metadata: Record<string, string>;
}): Promise<{ authorizationUrl: string }> {
  const data = await call<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      ...(input.subaccount ? { subaccount: input.subaccount } : {}),
    }),
  });
  return { authorizationUrl: data.authorization_url };
}

/** Double-checks a payment with Paystack before trusting it. */
export async function verifyTransaction(reference: string): Promise<{ status: string; amountKobo: number; currency: string }> {
  const data = await call<{ status: string; amount: number; currency: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return { status: data.status, amountKobo: data.amount, currency: data.currency };
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body, keyed with the secret key. */
export function verifyPaystackSignature(rawBody: string, header: string | null, secretKey: string): boolean {
  if (!header) return false;
  const expected = Buffer.from(createHmac("sha512", secretKey).update(rawBody, "utf8").digest("hex"));
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
