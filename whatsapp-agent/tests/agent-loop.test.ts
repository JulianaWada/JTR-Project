import type Anthropic from "@anthropic-ai/sdk";
import { asc, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AgentModel, ModelRequest, ModelResponse } from "@/lib/agent/model";
import { setAgentModel } from "@/lib/agent/run";
import type { Database } from "@/lib/db";
import { agentTurns, bookings, catalogItems, customers } from "@/lib/db/schema";
import { at, customerSays, outbox, setup } from "./helpers";

// The agent loop with a scripted stand-in for Claude: tool calls, transcript replay, failures.

class ScriptedModel implements AgentModel {
  requests: ModelRequest[] = [];
  constructor(private script: ((req: ModelRequest) => ModelResponse | Promise<ModelResponse>)[]) {}
  async respond(req: ModelRequest) {
    // Deep copy, since the loop reuses nothing but we want a snapshot of exactly what was sent.
    this.requests.push(JSON.parse(JSON.stringify(req)));
    const step = this.script.shift();
    if (!step) throw new Error("script exhausted");
    return step(req);
  }
}

const thinking = { type: "thinking", thinking: "", signature: "sig-abc" } as unknown as Anthropic.Beta.BetaContentBlock;
const say = (text: string): ModelResponse => ({ content: [thinking, { type: "text", text, citations: null }], stop_reason: "end_turn" }) as ModelResponse;
const call = (name: string, input: unknown, id = `toolu_${name}`): ModelResponse =>
  ({ content: [thinking, { type: "tool_use", id, name, input }], stop_reason: "tool_use" }) as ModelResponse;

let db: Database;
let braidsId: string;
beforeEach(async () => {
  ({ db } = await setup());
  braidsId = (await db.query.catalogItems.findFirst({ where: eq(catalogItems.name, "Knotless braids (mid-back)") }))!.id;
});
afterEach(() => setAgentModel(null));

describe("agent loop", () => {
  it("runs tools, replies once, and replays the stored transcript byte for byte", async () => {
    const model = new ScriptedModel([
      () => call("check_availability", { service_id: braidsId, date: "2026-10-25" }),
      (req) => {
        const result = (req.messages.at(-1)!.content as Anthropic.Beta.BetaToolResultBlockParam[])[0];
        expect(JSON.parse(String(result.content)).free_start_times_24h).toContain("14:00");
        return call("create_booking", { service_id: braidsId, date: "2026-10-25", time: "14:00", customer_name: "Ada Obi" }, "toolu_2");
      },
      () => say("Done! Your deposit link is coming next."),
      () => say("You're welcome!"),
    ]);
    setAgentModel(model);

    const now = at("2026-10-24", "10:00");
    const r = await customerSays(db, "salon", "Book braids tomorrow 2pm for Ada Obi", { now });
    const booking = await db.query.bookings.findFirst({ where: eq(bookings.customerId, r.customerId!) });
    expect(booking?.startsAt.toISOString()).toBe("2026-10-25T13:00:00.000Z");
    expect((await db.query.customers.findFirst({ where: eq(customers.id, r.customerId!) }))?.name).toBe("Ada Obi");

    const sent = await outbox(db, r.customerId!);
    expect(sent.map((m) => m.author)).toEqual(["ai", "system"]);
    expect(sent[1].body).toContain("₦7,500");

    // The customer message carries the Lagos time and ISO date.
    const firstUser = model.requests[0].messages[0].content as Anthropic.Beta.BetaTextBlockParam[];
    expect(firstUser[0].text).toMatch(/^\[Customer message, sent Saturday 24 October, 10am \(2026-10-24\) Lagos time\]/);

    await customerSays(db, "salon", "thank you", { now: new Date(now.getTime() + 60_000) });
    const last = model.requests.at(-1)!;
    const previous = model.requests[2];
    // Append-only: everything sent before is a prefix of the next request, thinking blocks included.
    expect(last.messages.slice(0, previous.messages.length + 1).slice(0, previous.messages.length)).toEqual(previous.messages);
    expect(JSON.stringify(last.messages)).toContain("sig-abc");
    // The payment-link message the system sent is shown to the agent as an automatic message.
    const newest = last.messages.at(-1)!.content as Anthropic.Beta.BetaTextBlockParam[];
    expect(newest[0].text).toMatch(/^\[Automatic message sent to the customer/);
    expect(newest.at(-1)!.text).toMatch(/thank you$/);
    // The system prompt is identical across turns, so it stays cached.
    expect(last.system).toBe(model.requests[0].system);

    const turns = await db.query.agentTurns.findMany({ where: eq(agentTurns.customerId, r.customerId!), orderBy: [asc(agentTurns.seq)] });
    expect(turns.map((t) => t.role)).toEqual(["user", "assistant", "user", "assistant", "user", "assistant", "user", "assistant"]);
  });

  it("turns tool errors into messages the model can act on", async () => {
    const model = new ScriptedModel([
      () => call("create_booking", { service_id: braidsId, date: "2026-10-25", time: "03:00", customer_name: "Ada" }),
      (req) => {
        const result = (req.messages.at(-1)!.content as Anthropic.Beta.BetaToolResultBlockParam[])[0];
        expect(result.is_error).toBe(true);
        expect(String(result.content)).toMatch(/not free/);
        return say("Sorry, 3am isn't available. How about 2pm?");
      },
    ]);
    setAgentModel(model);
    const r = await customerSays(db, "salon", "braids tomorrow 3am", { now: at("2026-10-24", "10:00") });
    expect((await outbox(db, r.customerId!))[0].body).toContain("2pm");
  });

  it("apologises and hands over when the model call fails", async () => {
    setAgentModel(new ScriptedModel([() => Promise.reject(new Error("overloaded"))]));
    const r = await customerSays(db, "salon", "hello", { now: at("2026-10-24", "10:00") });
    const c = await db.query.customers.findFirst({ where: eq(customers.id, r.customerId!) });
    expect(c?.mode).toBe("human");
    expect((await outbox(db, r.customerId!))[0].body).toMatch(/team will reply/);
  });

  it("ignores a webhook delivered twice", async () => {
    const model = new ScriptedModel([() => say("Hi!")]);
    setAgentModel(model);
    const now = at("2026-10-24", "10:00");
    const { handleInbound } = await import("@/lib/inbound");
    const msg = { phoneNumberId: "demo-salon", from: "2348000000009", id: "wamid.dup", timestamp: now, text: "hi", readable: true };
    expect((await handleInbound(db, msg, { now: () => now })).handled).toBe(true);
    expect((await handleInbound(db, msg, { now: () => now })).handled).toBe(false);
    expect(model.requests.length).toBe(1);
  });
});
