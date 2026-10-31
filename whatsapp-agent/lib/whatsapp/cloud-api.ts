import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// Meta's WhatsApp Cloud API. Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

export class WhatsAppError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: number,
  ) {
    super(message);
  }
}

async function post(phoneNumberId: string, body: Record<string, unknown>) {
  const token = env.whatsappToken;
  if (!token) throw new WhatsAppError("WHATSAPP_ACCESS_TOKEN is not set");
  const res = await fetch(`https://graph.facebook.com/${env.whatsappGraphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    messages?: { id: string }[];
    error?: { message?: string; code?: number };
  };
  if (!res.ok) {
    throw new WhatsAppError(json.error?.message ?? `WhatsApp API returned ${res.status}`, res.status, json.error?.code);
  }
  return json;
}

export async function sendText(phoneNumberId: string, to: string, text: string): Promise<string> {
  const json = await post(phoneNumberId, {
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: text, preview_url: true },
  });
  return json.messages?.[0]?.id ?? "";
}

/** Approved message templates are the only way to message someone more than 24 hours after they last wrote. */
export async function sendTemplate(
  phoneNumberId: string,
  to: string,
  name: string,
  bodyParams: string[],
): Promise<string> {
  const json = await post(phoneNumberId, {
    to,
    type: "template",
    template: {
      name,
      language: { code: env.whatsappTemplateLanguage },
      components: bodyParams.length
        ? [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }]
        : [],
    },
  });
  return json.messages?.[0]?.id ?? "";
}

export async function markRead(phoneNumberId: string, messageId: string) {
  await post(phoneNumberId, { status: "read", message_id: messageId });
}

/** Meta signs each webhook with the app secret: X-Hub-Signature-256: sha256=<hex>. */
export function verifyWhatsAppSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex"));
  const actual = Buffer.from(header.slice("sha256=".length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export type InboundMessage = {
  phoneNumberId: string;
  from: string;
  profileName?: string;
  id: string;
  timestamp: Date;
  /** What the agent reads. Non-text messages are described in words. */
  text: string;
  /** False for voice notes, images and other things the agent cannot read yet. */
  readable: boolean;
};

export type StatusUpdate = { id: string; status: string; error?: string };

type WebhookPayload = {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: RawMessage[];
        statuses?: { id?: string; status?: string; errors?: { title?: string; message?: string }[] }[];
      };
    }[];
  }[];
};

type RawMessage = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string; description?: string } };
  location?: { latitude?: number; longitude?: number; name?: string; address?: string };
  image?: { caption?: string };
};

function describe(m: RawMessage): { text: string; readable: boolean } {
  switch (m.type) {
    case "text":
      return { text: m.text?.body ?? "", readable: true };
    case "button":
      return { text: m.button?.text ?? "", readable: true };
    case "interactive":
      return {
        text: m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "",
        readable: true,
      };
    case "location": {
      const l = m.location ?? {};
      const label = [l.name, l.address].filter(Boolean).join(", ");
      return {
        text: `[Shared a location pin${label ? `: ${label}` : ""} (${l.latitude}, ${l.longitude}) https://maps.google.com/?q=${l.latitude},${l.longitude}]`,
        readable: true,
      };
    }
    case "image":
      return { text: `[Sent a photo${m.image?.caption ? ` with the caption: ${m.image.caption}` : ""}]`, readable: false };
    case "audio":
      return { text: "[Sent a voice note]", readable: false };
    case "video":
      return { text: "[Sent a video]", readable: false };
    case "document":
      return { text: "[Sent a document]", readable: false };
    case "sticker":
      return { text: "[Sent a sticker]", readable: true };
    default:
      return { text: `[Sent a message of type ${m.type ?? "unknown"}]`, readable: false };
  }
}

export function parseWebhook(payload: unknown): { messages: InboundMessage[]; statuses: StatusUpdate[] } {
  const out = { messages: [] as InboundMessage[], statuses: [] as StatusUpdate[] };
  for (const entry of (payload as WebhookPayload)?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value?.metadata?.phone_number_id;
      if (!value || !phoneNumberId) continue;
      const names = new Map((value.contacts ?? []).map((c) => [c.wa_id, c.profile?.name]));
      for (const m of value.messages ?? []) {
        if (!m.from || !m.id) continue;
        const { text, readable } = describe(m);
        out.messages.push({
          phoneNumberId,
          from: m.from,
          profileName: names.get(m.from) ?? undefined,
          id: m.id,
          timestamp: m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date(),
          text,
          readable,
        });
      }
      for (const s of value.statuses ?? []) {
        if (!s.id || !s.status) continue;
        const err = s.errors?.[0];
        out.statuses.push({ id: s.id, status: s.status, error: err ? (err.message ?? err.title) : undefined });
      }
    }
  }
  return out;
}
