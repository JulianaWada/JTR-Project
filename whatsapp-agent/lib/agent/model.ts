import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

export type ModelRequest = {
  system: string;
  tools: Anthropic.Beta.BetaTool[];
  messages: Anthropic.Beta.BetaMessageParam[];
};

export type ModelResponse = Pick<Anthropic.Beta.BetaMessage, "content" | "stop_reason">;

/** The one call the agent makes. Swapped for a scripted fake in tests and for the offline demo brain. */
export interface AgentModel {
  respond(request: ModelRequest): Promise<ModelResponse>;
}

let client: Anthropic | null = null;

export class ClaudeModel implements AgentModel {
  async respond({ system, tools, messages }: ModelRequest): Promise<ModelResponse> {
    client ??= new Anthropic({ apiKey: env.anthropicApiKey });
    const toolsWithCache = tools.map((t, i) =>
      i === tools.length - 1 ? { ...t, cache_control: { type: "ephemeral" as const } } : t,
    );
    return client.beta.messages.create({
      model: env.agentModel,
      max_tokens: 8000,
      // Customer chat: short answers, latency matters.
      output_config: { effort: "low" },
      // The transcript is append-only, but the system prompt changes when the owner edits the business
      // details. Dropping affected thinking blocks then is better than failing the request.
      thinking: { type: "adaptive", block_binding: { prefix_mismatch_behavior: "drop_block" } },
      // If a safety classifier declines, the request is retried on a fallback model server-side.
      betas: ["server-side-fallback-2026-07-01", "thinking-binding-controls-2026-08-01"],
      fallbacks: "default",
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      tools: toolsWithCache,
      messages,
      // Cache the conversation so far, so each new message only pays for what's new.
      cache_control: { type: "ephemeral" },
    });
  }
}
