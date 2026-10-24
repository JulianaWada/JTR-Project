import type Anthropic from "@anthropic-ai/sdk";
import { and, asc, eq, inArray, isNull, lt, max, or, sql } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { agentTurns, catalogItems, customers, messages, tenants, type Customer, type Message } from "@/lib/db/schema";
import { env, modes } from "@/lib/env";
import { sendToCustomer } from "@/lib/messaging";
import { formatLagos, lagosDate } from "@/lib/time";
import { MockBrain } from "./mock-brain";
import { ClaudeModel, type AgentModel } from "./model";
import { buildSystemPrompt } from "./prompt";
import { handOver, runTool, toolsFor, type ToolContext } from "./tools";

const LEASE_MS = 2 * 60 * 1000;
const MAX_MODEL_CALLS = 8;
/** Older turns are dropped from the front once a chat gets long. */
const MAX_TURNS_SENT = 60;

let modelOverride: AgentModel | null = null;
/** Tests use this to script the model's replies. */
export function setAgentModel(model: AgentModel | null) {
  modelOverride = model;
}

function pickModel(): AgentModel {
  if (modelOverride) return modelOverride;
  return modes().claude === "live" ? new ClaudeModel() : new MockBrain();
}

type BlockParam = Anthropic.Beta.BetaContentBlockParam;

/** How a dashboard message appears in the agent's transcript. */
function describeForAgent(m: Message): string {
  const when = `${formatLagos(m.createdAt)} (${lagosDate(m.createdAt)})`;
  switch (m.author) {
    case "customer":
      return `[Customer message, sent ${when} Lagos time]\n${m.body}`;
    case "owner":
      return `[Staff member replied to the customer, ${when}]\n${m.body}`;
    default:
      return `[Automatic message sent to the customer, ${when}]\n${m.body}`;
  }
}

async function acquireLease(db: Database, customerId: string, now: Date) {
  const rows = await db
    .update(customers)
    .set({ agentLeaseUntil: new Date(now.getTime() + LEASE_MS) })
    .where(and(eq(customers.id, customerId), or(isNull(customers.agentLeaseUntil), lt(customers.agentLeaseUntil, now))))
    .returning({ id: customers.id });
  return rows.length > 0;
}

async function nextSeq(db: Database, customerId: string) {
  const [row] = await db.select({ value: max(agentTurns.seq) }).from(agentTurns).where(eq(agentTurns.customerId, customerId));
  return (row?.value ?? -1) + 1;
}

async function appendTurn(db: Database, customerId: string, role: "user" | "assistant", content: unknown[]) {
  const seq = await nextSeq(db, customerId);
  await db.insert(agentTurns).values({ customerId, seq, role, content });
}

function isToolResultTurn(content: unknown[]) {
  return content.some((b) => (b as { type?: string }).type === "tool_result");
}

/** The stored transcript, replayed exactly as it was sent and received. */
async function loadTranscript(db: Database, customerId: string): Promise<Anthropic.Beta.BetaMessageParam[]> {
  const rows = await db.query.agentTurns.findMany({
    where: eq(agentTurns.customerId, customerId),
    orderBy: [asc(agentTurns.seq)],
  });
  let start = Math.max(0, rows.length - MAX_TURNS_SENT);
  // Always start on a customer turn, never in the middle of a tool call.
  while (start < rows.length && (rows[start].role !== "user" || isToolResultTurn(rows[start].content))) start++;
  return rows.slice(start).map((r) => ({ role: r.role, content: r.content as BlockParam[] }));
}

/**
 * Lets the agent answer everything new in one chat. Only one run per chat happens at a time;
 * messages that arrive during a run are picked up before the run ends.
 */
export async function processChat(db: Database, customerId: string, opts: { now?: () => Date } = {}) {
  const clock = opts.now ?? (() => new Date());
  if (!(await acquireLease(db, customerId, clock()))) return;
  try {
    for (let round = 0; round < 5; round++) {
      const customer = await db.query.customers.findFirst({ where: eq(customers.id, customerId) });
      if (!customer || customer.mode !== "ai") return;
      const unseen = await db.query.messages.findMany({
        where: and(eq(messages.customerId, customerId), eq(messages.seenByAgent, false)),
        orderBy: [asc(messages.createdAt)],
      });
      // The agent only speaks when the customer has said something new.
      if (!unseen.some((m) => m.author === "customer")) return;
      await appendTurn(
        db,
        customerId,
        "user",
        unseen.map((m) => ({ type: "text", text: describeForAgent(m) })),
      );
      await db
        .update(messages)
        .set({ seenByAgent: true })
        .where(inArray(messages.id, unseen.map((m) => m.id)));
      await answer(db, customer, clock());
    }
  } finally {
    await db.update(customers).set({ agentLeaseUntil: null }).where(eq(customers.id, customerId));
  }
}

async function answer(db: Database, customer: Customer, now: Date) {
  const tenant = (await db.query.tenants.findFirst({ where: eq(tenants.id, customer.tenantId) }))!;
  const items = await db.query.catalogItems.findMany({
    where: eq(catalogItems.tenantId, tenant.id),
    orderBy: [asc(catalogItems.sortOrder), asc(catalogItems.name)],
  });
  const tools = toolsFor(tenant);
  const system = buildSystemPrompt(tenant, items);
  const ctx: ToolContext = { db, tenant, customer, items, now, followUps: [], handedOver: false };
  const model = pickModel();

  let reply = "";
  let failed = false;
  try {
    for (let call = 0; call < MAX_MODEL_CALLS; call++) {
      const response = await model.respond({
        system,
        tools: tools.map((t) => t.definition),
        messages: await loadTranscript(db, customer.id),
      });

      if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
        failed = true;
        break;
      }
      await appendTurn(db, customer.id, "assistant", response.content as unknown[]);

      const text = response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text.trim())
        .filter(Boolean)
        .join("\n\n");
      const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");

      if (response.stop_reason === "pause_turn") continue;
      if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
        reply = text;
        break;
      }
      // Text written before a tool call is usually "one moment"; keep only the final answer.
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const use of toolUses) {
        const result = await runTool(use.name, use.input, ctx);
        results.push({ type: "tool_result", tool_use_id: use.id, content: result.content, is_error: result.isError || undefined });
      }
      await appendTurn(db, customer.id, "user", results);
      if (call === MAX_MODEL_CALLS - 1) failed = true;
    }
  } catch (err) {
    console.error("[agent] model call failed", err);
    failed = true;
  }

  if (failed) {
    const fresh = (await db.query.customers.findFirst({ where: eq(customers.id, customer.id) }))!;
    await sendToCustomer(db, tenant, fresh, "Sorry, I'm having a little trouble right now. A member of our team will reply to you here shortly. 🙏", {
      author: "system",
      now,
    });
    if (!ctx.handedOver) await handOver(db, tenant, fresh, "The AI assistant hit an error and could not answer.");
    return;
  }

  const fresh = (await db.query.customers.findFirst({ where: eq(customers.id, customer.id) }))!;
  if (reply) {
    if (!fresh.privacyNoticeSentAt) {
      reply += `\n\n_You're chatting with ${tenant.name}'s AI assistant. Reply HUMAN to talk to a person, or STOP to stop reminders. Privacy: ${env.appUrl}/privacy/${tenant.slug}_`;
      await db.update(customers).set({ privacyNoticeSentAt: now }).where(eq(customers.id, customer.id));
    }
    const sent = await sendToCustomer(db, tenant, fresh, reply, { author: "ai", now });
    // The agent wrote this one, so it is already in its transcript.
    await db.update(messages).set({ seenByAgent: true }).where(eq(messages.id, sent.id));
  }
  for (const followUp of ctx.followUps) {
    await sendToCustomer(db, tenant, fresh, followUp, { author: "system", now });
  }
}

/** Number of chats waiting for a person, for the dashboard badge. */
export async function attentionCount(db: Database, tenantId: string) {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(customers)
    .where(and(eq(customers.tenantId, tenantId), eq(customers.needsAttention, true)));
  return row?.value ?? 0;
}
