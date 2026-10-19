import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { locales } from "@/i18n/routing";
import { ASSISTANT_SYSTEM_PROMPT } from "@/lib/assistant/prompt";
import { saveLeadInput, saveLeadTool } from "@/lib/assistant/tools";
import { saveLead } from "@/lib/leads/handler";
import { MAX_MESSAGE_LENGTH, type ChatStreamEvent } from "@/lib/assistant/config";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

const MAX_HISTORY = 20;
const MAX_TOOL_ROUNDS = 3;
const MODEL = "claude-sonnet-5-5";

const perMinute = createRateLimiter({ limit: 10, windowMs: 60 * 1000 });
const perDay = createRateLimiter({ limit: 150, windowMs: 24 * 60 * 60 * 1000 });

const requestSchema = z.object({
  locale: z.enum(locales).default("en"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        // Assistant turns are echoed back from earlier replies, so allow them more room.
        content: z.string().trim().min(1).max(6000),
      }),
    )
    .min(1)
    .max(60),
});

let client: Anthropic | null = null;
function getClient() {
  // The key is read on the server only and never sent to the browser.
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

function errorResponse(code: Extract<ChatStreamEvent, { type: "error" }>["code"], status: number, headers?: HeadersInit) {
  return new Response(`${JSON.stringify({ type: "error", code })}\n`, {
    status,
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", ...headers },
  });
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const minute = perMinute(ip);
  const day = perDay(ip);
  if (!minute.ok || !day.ok) {
    return errorResponse("rate_limited", 429, { "Retry-After": String(Math.max(minute.retryAfter, day.retryAfter)) });
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return errorResponse("invalid", 400);
  }

  const last = body.messages[body.messages.length - 1];
  if (last.role !== "user") return errorResponse("invalid", 400);
  if (last.content.length > MAX_MESSAGE_LENGTH) return errorResponse("too_long", 413);

  const anthropic = getClient();
  if (!anthropic) {
    console.error("[chat] ANTHROPIC_API_KEY is not set");
    return errorResponse("unavailable", 503);
  }

  // Keep the most recent turns, starting from a user message.
  let history = body.messages.slice(-MAX_HISTORY);
  while (history.length && history[0].role !== "user") history = history.slice(1);

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        let wroteText = false;
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const response = anthropic.beta.messages.stream(
            {
              model: MODEL,
              max_tokens: 8000,
              // Chat answers are short and latency matters, so low effort is enough.
              output_config: { effort: "low" },
              // If a safety classifier declines, retry on a fallback model server-side.
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              system: [
                // Stable prompt first so it can be cached; the per-request site language comes after it.
                { type: "text", text: ASSISTANT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
                { type: "text", text: `The visitor is browsing the site in this language: ${body.locale}.` },
              ],
              tools: [saveLeadTool],
              messages,
            },
            { signal: request.signal },
          );

          // Separate text from consecutive rounds (before and after a tool call) with a blank line.
          let roundStarted = false;
          response.on("text", (delta) => {
            if (!roundStarted && wroteText) send({ type: "text", text: "\n\n" });
            roundStarted = true;
            wroteText = true;
            send({ type: "text", text: delta });
          });
          const message = await response.finalMessage();

          if (message.stop_reason === "refusal") {
            send({ type: "error", code: "unavailable" });
            break;
          }
          const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
          if (message.stop_reason !== "tool_use" || toolUses.length === 0) break;

          messages.push({ role: "assistant", content: message.content });
          const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
          for (const tool of toolUses) {
            const input = saveLeadInput.safeParse(tool.input);
            if (tool.name !== "save_lead" || !input.success) {
              results.push({ type: "tool_result", tool_use_id: tool.id, is_error: true, content: "Invalid input. Ask the visitor to confirm their name, email and project summary." });
              continue;
            }
            const { project_summary, ...contact } = input.data;
            const saved = await saveLead({
              source: "assistant",
              ...contact,
              // The form stores ISO country codes; the assistant gets free text, so keep it in the message.
              country: undefined,
              message: contact.country ? `${project_summary}\n\nCountry: ${contact.country}` : project_summary,
              locale: body.locale,
            });
            if (saved.ok) send({ type: "lead_saved" });
            results.push({
              type: "tool_result",
              tool_use_id: tool.id,
              is_error: !saved.ok,
              content: saved.ok ? "Saved. The team will follow up by email." : "Saving failed. Suggest the contact form or email instead.",
            });
          }
          messages.push({ role: "user", content: results });
        }
      } catch (err) {
        if (!request.signal.aborted) {
          if (err instanceof Anthropic.RateLimitError) console.error("[chat] Anthropic rate limit", err.message);
          else if (err instanceof Anthropic.APIError) console.error(`[chat] Anthropic API error ${err.status}`, err.message);
          else console.error("[chat] failed", err);
          send({ type: "error", code: "unavailable" });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
