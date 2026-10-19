/** Shared between the chat API and the chat UI. */
export const MAX_MESSAGE_LENGTH = 1000;

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export type ChatStreamEvent =
  | { type: "text"; text: string }
  | { type: "lead_saved" }
  | { type: "error"; code: "rate_limited" | "too_long" | "invalid" | "unavailable" };
