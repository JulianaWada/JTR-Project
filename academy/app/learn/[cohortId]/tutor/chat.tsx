"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { ask } from "./actions";

type Message = { role: "user" | "assistant"; content: string };

const suggestions: Record<string, string[]> = {
  sales: ["How do I write a good prompt for an Instagram advert?", "What should I reply when a customer says my price is too high?", "Help me start my customer profile"],
  animation: ["How do I keep my character looking the same in every scene?", "What makes a good hook for a 30-second video?", "Help me plan my storyboard"],
};

export function TutorChat({ cohortId, initial, prefill, topic, firstName }: { cohortId: string; initial: Message[]; prefill?: string; topic: "sales" | "animation"; firstName: string }) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [draft, setDraft] = useState(prefill ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  function send(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    setError(null);
    setDraft("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    start(async () => {
      const result = await ask(cohortId, text);
      if (result.error) {
        setError(result.error);
        setMessages((m) => m.slice(0, -1));
        setDraft(text);
      } else if (result.answer) {
        setMessages((m) => [...m, { role: "assistant", content: result.answer! }]);
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[28rem] flex-col overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md py-8 text-center">
            <p className="text-4xl" aria-hidden>
              ✨
            </p>
            <p className="mt-3 font-display text-lg font-semibold text-ink">Hi {firstName}, what would you like help with?</p>
            <p className="mt-1 text-sm text-muted">I&apos;ve read every lesson in this course. Ask me anything, or try one of these:</p>
            <div className="mt-4 flex flex-col gap-2">
              {suggestions[topic].map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="rounded-xl border border-line px-4 py-2.5 text-start text-sm text-ink hover:border-primary hover:text-primary">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user" ? "rounded-br-sm bg-primary text-primary-ink" : "rounded-bl-sm bg-surface-2 text-ink",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-surface-2 px-4 py-3 text-sm text-muted">Thinking…</div>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <form
        className="border-t border-line p-3 sm:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        {error && <p className="mb-2 text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={1}
            placeholder="Ask a question about the course…"
            className="input min-h-11 resize-none"
            aria-label="Your question"
          />
          <button className="btn-primary" disabled={pending || !draft.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
