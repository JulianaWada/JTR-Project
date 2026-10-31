import { inArray } from "drizzle-orm";
import { after } from "next/server";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { handleInbound } from "@/lib/inbound";
import { markRead, parseWebhook, verifyWhatsAppSignature } from "@/lib/whatsapp/cloud-api";

// Allow time for the agent to answer after Meta has been told the message arrived.
export const maxDuration = 60;

/** Meta calls this once when the webhook is set up, to check the verify token. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && env.whatsappVerifyToken && token === env.whatsappVerifyToken && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

const STATUS_MAP: Record<string, "sent" | "delivered" | "read" | "failed"> = {
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed",
};

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = env.whatsappAppSecret;
  if (!secret) {
    console.error("[whatsapp] WHATSAPP_APP_SECRET is not set, so webhooks can't be verified");
    return new Response("Not configured", { status: 503 });
  }
  if (!verifyWhatsAppSignature(raw, request.headers.get("x-hub-signature-256"), secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  const { messages, statuses } = parseWebhook(payload);

  // Answer Meta straight away; it retries webhooks that take too long. The agent runs afterwards.
  after(async () => {
    const db = await getDb();
    for (const s of statuses) {
      const status = STATUS_MAP[s.status];
      if (!status) continue;
      await db
        .update(schema.messages)
        .set({ status, error: s.error ?? null })
        .where(inArray(schema.messages.waMessageId, [s.id]));
    }
    for (const m of messages) {
      markRead(m.phoneNumberId, m.id).catch(() => {});
      try {
        await handleInbound(db, m);
      } catch (err) {
        console.error("[whatsapp] failed to handle message", m.id, err);
      }
    }
  });
  return new Response("OK", { status: 200 });
}
