"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { ChatMessage, ChatStreamEvent } from "@/lib/assistant/config";

const STORAGE_KEY = "jtr-chat";

export type ChatStatus = "idle" | "streaming" | "error";
export type ChatError = "rate_limited" | "too_long" | "unavailable" | null;

/** Chat state + streaming from /api/chat. Kept in sessionStorage so it survives page changes. */
export function useChat() {
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<ChatError>(null);
  const [leadSaved, setLeadSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore from browser storage after mount
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || status === "streaming") return;
      const history: ChatMessage[] = [...messages, { role: "user", content }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setStatus("streaming");
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;
      let reply = "";
      let failed: ChatError = null;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, messages: history.filter((m) => m.content) }),
          signal: controller.signal,
        });
        if (!res.body) throw new Error("no body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as ChatStreamEvent;
            if (event.type === "text") {
              reply += event.text;
              setMessages([...history, { role: "assistant", content: reply }]);
            } else if (event.type === "lead_saved") {
              setLeadSaved(true);
            } else if (event.type === "error") {
              failed = event.code === "invalid" ? "unavailable" : event.code;
            }
          }
        }
        if (!res.ok && !failed) failed = "unavailable";
      } catch (err) {
        if ((err as Error).name !== "AbortError") failed = "unavailable";
      } finally {
        abortRef.current = null;
      }

      // Drop an empty assistant bubble; the error banner explains what happened.
      setMessages(reply ? [...history, { role: "assistant", content: reply }] : history);
      setError(failed);
      setStatus(failed ? "error" : "idle");
    },
    [locale, messages, status],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setLeadSaved(false);
    setStatus("idle");
  }, []);

  return { messages, status, error, leadSaved, send, stop, reset };
}
