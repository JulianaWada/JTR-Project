import type Anthropic from "@anthropic-ai/sdk";
import { addDays, WEEKDAYS } from "@/lib/time";
import type { AgentModel, ModelRequest, ModelResponse } from "./model";

/**
 * A rule-based stand-in for Claude, used when no ANTHROPIC_API_KEY is set. It understands a few
 * simple phrasings in English and Pidgin and calls the same tools Claude would, so bookings,
 * orders, payment links and hand-overs can be demoed and tested end to end without an API key.
 * It is deliberately basic: the real agent is Claude.
 */

type Catalog = { id: string; name: string; price: string }[];
type Block = Anthropic.Beta.BetaContentBlockParam;

const PIDGIN = /\b(abeg|wetin|dey|una|wan|abi|oya|sabi|how far|e don|biko|make i|i go|no vex|una get|how much be)\b/i;

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const STOP_WORDS = new Set(["and", "with", "the", "for", "from", "plate", "plates", "small", "mid-back"]);

function parseCatalog(system: string): Catalog {
  const out: Catalog = [];
  for (const line of system.split("\n")) {
    const m = /^- (.+?): (₦[\d,.]+).*\[id: ([0-9a-f-]+)\]$/.exec(line.trim());
    if (m) out.push({ name: m[1], price: m[2], id: m[3] });
  }
  return out;
}

function keywords(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .split(/[^a-z']+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function findItems(text: string, catalog: Catalog) {
  const lower = text.toLowerCase();
  const found: { id: string; name: string; quantity: number }[] = [];
  // Words shared by several items ("rice" in jollof rice and fried rice) don't identify one.
  const seen = new Map<string, number>();
  for (const item of catalog) for (const w of new Set(keywords(item.name))) seen.set(w, (seen.get(w) ?? 0) + 1);
  for (const item of catalog) {
    for (const word of keywords(item.name).filter((w) => seen.get(w) === 1)) {
      const stem = word.replace(/s$/, "");
      const m = new RegExp(`(?:(\\d+|${Object.keys(NUMBER_WORDS).join("|")})\\s*(?:x\\s*)?(?:plates? of\\s+|packs? of\\s+)?)?\\b${stem}`, "i").exec(lower);
      if (m) {
        const q = m[1] ? (NUMBER_WORDS[m[1]] ?? Number(m[1])) : 1;
        found.push({ id: item.id, name: item.name, quantity: q });
        break;
      }
    }
  }
  return found;
}

function findDate(text: string, today: string): string | null {
  const lower = text.toLowerCase();
  if (/\b(today|tonight|this evening)\b/.test(lower)) return today;
  if (/\b(tomorrow|tmrw|tomoro|tomorow|tumoro)\b/.test(lower)) return addDays(today, 1);
  const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayIndex = WEEKDAYS.indexOf(
    WEEKDAYS[new Date(`${today}T12:00:00Z`).getUTCDay()],
  );
  for (let i = 0; i < names.length; i++) {
    if (lower.includes(names[i])) {
      const diff = (i - todayIndex + 7) % 7 || 7;
      return addDays(today, diff);
    }
  }
  return null;
}

function findTime(text: string): string | null {
  const m =
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i.exec(text) ??
    /\b(\d{1,2}):(\d{2})\b/.exec(text) ??
    /\b(?:by|at)\s+(\d{1,2})(?::(\d{2}))?\b/i.exec(text);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = m[2] ?? "00";
  const suffix = m[3]?.toLowerCase();
  if (suffix === "pm" && hour < 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  // "by 2" in a salon means 2pm.
  if (!suffix && hour < 8) hour += 12;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function findName(texts: string[]): string | null {
  for (const t of [...texts].reverse()) {
    const m = /\b(?:my name is|name is|i'?m|na me|call me|under the name)\s+([A-Za-z][A-Za-z'-]+(?:\s+[A-Za-z][A-Za-z'-]+)?)/i.exec(t);
    if (m) return m[1];
    if (/^[A-Za-z][A-Za-z'-]+(?:\s+[A-Za-z][A-Za-z'-]+)?$/.test(t.trim()) && t.trim().length <= 30 && !/^(yes|yeah|ok|okay|no|hi|hello|thanks|pickup|delivery)$/i.test(t.trim())) {
      return t.trim();
    }
  }
  return null;
}

function text(t: string): ModelResponse {
  return { content: [{ type: "text", text: t, citations: null }], stop_reason: "end_turn" } as ModelResponse;
}

let callId = 0;
function tool(name: string, input: Record<string, unknown>): ModelResponse {
  return {
    content: [{ type: "tool_use", id: `toolu_mock_${Date.now()}_${callId++}`, name, input }],
    stop_reason: "tool_use",
  } as ModelResponse;
}

/** The customer's words from the turns since the last booking or order, newest last. */
function recentCustomerTexts(messages: ModelRequest["messages"]) {
  const texts: string[] = [];
  let today = new Date().toISOString().slice(0, 10);
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const blocks = (typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content) as Block[];
    if (m.role === "assistant" && blocks.some((b) => b.type === "tool_use" && ["create_booking", "create_order", "handover_to_human"].includes(b.name))) break;
    if (m.role !== "user") continue;
    for (const b of [...blocks].reverse()) {
      if (b.type !== "text") continue;
      const header = /^\[Customer message, sent .*?\((\d{4}-\d{2}-\d{2})\).*?\]\n([\s\S]*)$/.exec(b.text);
      if (header) {
        if (texts.length === 0) today = header[1];
        texts.unshift(header[2]);
      }
    }
    if (texts.length >= 4) break;
  }
  return { texts, today };
}

function afterTool(name: string, result: string, isError: boolean, pidgin: boolean): ModelResponse {
  if (isError) return text(pidgin ? `No vex, ${result.charAt(0).toLowerCase()}${result.slice(1)}` : `Sorry, ${result.charAt(0).toLowerCase()}${result.slice(1)}`);
  const r = JSON.parse(result) as Record<string, unknown>;
  switch (name) {
    case "check_availability": {
      if (r.closed) return text(pidgin ? "We no dey open that day. Abeg pick another day." : "We're closed that day. Could you pick another day?");
      const times = (r.free_start_times_24h as string[]) ?? [];
      if (!times.length) return text(pidgin ? "That day don full. Try another day abeg." : "That day is fully booked. Could another day work?");
      return text(`${pidgin ? "Free times for" : "Free times for"} ${r.service} on ${r.date}: ${times.slice(0, 8).join(", ")}. ${pidgin ? "Which time you want, and wetin be your name?" : "Which time suits you, and what name should I put it under?"}`);
    }
    case "create_booking":
      return text(
        r.status === "confirmed"
          ? pidgin
            ? `E don set! I don book ${r.summary}. We go remind you before the day.`
            : `All set! I've booked ${r.summary}. We'll send you a reminder before your appointment.`
          : pidgin
            ? `I don hold am for you: ${r.summary}. Deposit na *${r.deposit_due}*, I go send the payment link for the next message.`
            : `I've held it for you: ${r.summary}. The deposit is *${r.deposit_due}*; the payment link is coming in the next message.`,
      );
    case "create_order":
      return text(
        pidgin
          ? `Your order don enter: ${String(r.summary).split(". Code")[0]}. Code *${r.order_code}*. Payment link dey come for the next message.`
          : `Your order is in: ${String(r.summary).split(". Code")[0]}. Code *${r.order_code}*. The payment link is coming in the next message.`,
      );
    case "get_my_orders_and_bookings": {
      const lines = [...((r.orders as string[]) ?? []), ...((r.upcoming_bookings as string[]) ?? [])];
      return text(lines.length ? lines.map((l) => `• ${l}`).join("\n") : pidgin ? "I no see any order or booking for this number." : "I can't see any orders or bookings for this number yet.");
    }
    case "handover_to_human":
      return text(pidgin ? "No wahala, I don call person from the team. Dem go reply you here soon." : "No problem, I've asked a member of the team to take over. They'll reply to you here shortly.");
    case "resend_payment_link":
      return text(pidgin ? "I don send the link again for the next message." : "Sending the payment link again in the next message.");
    case "cancel_booking":
      return text(pidgin ? `I don cancel am: ${r.cancelled}.` : `Done, I've cancelled ${r.cancelled}.`);
    default:
      return text("Done.");
  }
}

export class MockBrain implements AgentModel {
  async respond({ system, tools, messages }: ModelRequest): Promise<ModelResponse> {
    const catalog = parseCatalog(system);
    const isFood = tools.some((t) => t.name === "create_order");
    const { texts, today } = recentCustomerTexts(messages);
    const latest = texts.at(-1) ?? "";
    const all = texts.join("\n");
    const pidgin = PIDGIN.test(all);

    // Answering a tool result.
    const last = messages.at(-1);
    if (last && Array.isArray(last.content) && last.content.some((b) => b.type === "tool_result")) {
      const prev = messages.at(-2);
      const use = (prev?.content as Block[]).find((b) => b.type === "tool_use") as Anthropic.Beta.BetaToolUseBlockParam;
      const res = (last.content as Block[]).find((b) => b.type === "tool_result") as Anthropic.Beta.BetaToolResultBlockParam;
      return afterTool(use.name, String(res.content), !!res.is_error, pidgin);
    }

    const lower = latest.toLowerCase();
    if (/\[sent a (voice note|photo|video|document)/i.test(latest)) {
      return text(pidgin ? "Abeg type am for me, I no fit open voice note or picture for now." : "Sorry, I can't open voice notes or photos yet. Could you type your message for me?");
    }
    if (/\b(human|person|manager|complain|complaint|refund|customer care|real person|talk to someone)\b/.test(lower)) {
      return tool("handover_to_human", { reason: `Customer asked: "${latest.slice(0, 120)}"` });
    }
    const code = /\b(OR|BK)-[A-Z0-9]{5}\b/i.exec(latest)?.[0];
    if (code && /\b(link|pay)\b/.test(lower)) return tool("resend_payment_link", { code });
    if (code && /\bcancel\b/.test(lower)) return tool("cancel_booking", { booking_code: code });
    if (/\b(status|my order|my booking|have you received|did you receive|e don land|where is my|where my)\b/.test(lower)) {
      return tool("get_my_orders_and_bookings", {});
    }
    if (/\b(price|prices|menu|how much|list|services|wetin una get|wetin una dey sell|wetin una dey do)\b/.test(lower)) {
      const list = catalog.map((c) => `• ${c.name}: ${c.price}`).join("\n");
      return text(`${pidgin ? "See wetin we get:" : isFood ? "Here's our menu today:" : "Here are our services and prices:"}\n${list}\n\n${isFood ? (pidgin ? "Wetin you go like order?" : "What would you like to order?") : pidgin ? "Which one you wan book, and which day?" : "Which would you like to book, and for when?"}`);
    }
    if (/\b(open|close|closing|hours|address|location|where are you|where una dey)\b/.test(lower)) {
      const hours = /Opening hours \(Lagos time\):\n([\s\S]*?)\n\n/.exec(system)?.[1] ?? "";
      const address = /Address: (.*)/.exec(system)?.[1] ?? "";
      return text(`📍 ${address}\n\n🕘 Opening hours:\n${hours}`);
    }

    if (isFood) {
      const items = findItems(all, catalog);
      if (items.length) {
        const delivery = /\b(deliver|delivery|send am|bring am|bring it)\b/i.test(all);
        const pickup = /\b(pick ?up|collect|come carry|i go come)\b/i.test(all);
        const address = /\b(?:deliver(?:y)?|send am|bring (?:it|am))\s+(?:to|for)\s+(.{6,})/i.exec(all)?.[1] ?? /\baddress(?: is|:)\s*(.{6,})/i.exec(all)?.[1];
        if (pickup) return tool("create_order", { items: items.map((i) => ({ item_id: i.id, quantity: i.quantity })), fulfilment: "pickup" });
        if (delivery && address) {
          return tool("create_order", {
            items: items.map((i) => ({ item_id: i.id, quantity: i.quantity })),
            fulfilment: "delivery",
            delivery_address: address.split("\n")[0].trim(),
          });
        }
        const summary = items.map((i) => `${i.quantity} x ${i.name}`).join(", ");
        if (delivery) return text(pidgin ? `Correct! ${summary}. Wetin be your delivery address?` : `Great: ${summary}. What's the delivery address?`);
        return text(pidgin ? `Okay o: ${summary}. You want make we deliver am or you go come pick up?` : `Got it: ${summary}. Would you like delivery or pickup?`);
      }
    } else {
      const service = findItems(all, catalog)[0];
      if (service) {
        const date = findDate(all, today);
        const time = findTime(all);
        const name = findName(texts);
        if (date && time && name) {
          return tool("create_booking", { service_id: service.id, date, time, customer_name: name });
        }
        if (date && !time) return tool("check_availability", { service_id: service.id, date });
        const missing = [!date && (pidgin ? "which day" : "which day"), !time && (pidgin ? "what time" : "what time"), !name && (pidgin ? "the name for the booking" : "the name for the booking")]
          .filter(Boolean)
          .join(", ");
        return text(pidgin ? `${service.name}, correct choice! Abeg tell me ${missing}.` : `${service.name}, lovely choice! Please tell me ${missing}.`);
      }
    }

    if (/\b(thank|thanks|tanks|tank you)\b/.test(lower)) return text(pidgin ? "You welcome! 🙏🏾" : "You're welcome! 😊");
    const business = /^Name: (.*)$/m.exec(system)?.[1] ?? "us";
    return text(
      pidgin
        ? `How far! Welcome to ${business}. I fit help you with prices, ${isFood ? "orders and delivery" : "bookings"}. Wetin you need?`
        : `Hello, welcome to ${business}! I can help with prices, ${isFood ? "orders and delivery" : "bookings"} and any questions. What can I do for you?`,
    );
  }
}
