"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ChatMessageView } from "@/lib/chat";
import { cn } from "@/lib/cn";
import { loadChat, pinChat, removeChat, sendChat } from "./actions";

/** How often the open chat checks for new messages. */
const REFRESH_MS = 5000;
const MAX_LENGTH = 1000;

export function ClassChat({ cohortId, initial, teacher }: { cohortId: string; initial: ChatMessageView[]; teacher: boolean }) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const list = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastId = messages.at(-1)?.id;

  // New messages scroll into view, unless the reader has scrolled up to read older ones.
  useEffect(() => {
    const el = list.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const result = await loadChat(cohortId);
        if (!stopped && result.messages) setMessages(result.messages);
      } catch {
        // Offline for a moment; the next tick tries again.
      }
    };
    const timer = setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [cohortId]);

  function apply(action: () => Promise<{ messages?: ChatMessageView[]; error?: string }>, onError?: () => void) {
    setError(null);
    start(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        onError?.();
      } else if (result.messages) setMessages(result.messages);
    });
  }

  function send() {
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    stickToBottom.current = true;
    apply(() => sendChat(cohortId, text), () => setDraft(text));
  }

  const pinned = messages.filter((m) => m.pinned);

  return (
    <div className="flex h-[calc(100vh-15rem)] min-h-[28rem] flex-col overflow-hidden rounded-card border border-line bg-surface">
      {pinned.length > 0 && (
        <div className="max-h-36 space-y-1.5 overflow-y-auto border-b border-line bg-primary-soft px-4 py-3 sm:px-6">
          {pinned.map((m) => (
            <p key={m.id} className="text-sm text-ink">
              <span className="font-semibold text-primary">📌 {m.author}:</span> <span className="whitespace-pre-wrap">{m.body}</span>
            </p>
          ))}
        </div>
      )}
      <div
        ref={list}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="mx-auto max-w-md py-10 text-center">
            <p className="text-4xl" aria-hidden>
              👋
            </p>
            <p className="mt-3 font-display text-lg font-semibold text-ink">Say hello to your classmates</p>
            <p className="mt-1 text-sm text-muted">Introduce yourself: your name, where you are, and what you want to get from this course.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex flex-col", m.mine ? "items-end" : "items-start")}>
            {!m.mine && (
              <p className="mb-1 flex items-center gap-1.5 px-1 text-xs font-medium text-ink">
                {m.author}
                {m.fromTeacher && <span className="pill bg-primary-soft text-primary">Teacher</span>}
              </p>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap",
                m.mine ? "rounded-br-sm bg-primary text-primary-ink" : m.fromTeacher ? "rounded-bl-sm border border-primary/30 bg-primary-soft text-ink" : "rounded-bl-sm bg-surface-2 text-ink",
              )}
            >
              {m.body}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-3 px-1 text-[11px] text-muted">
              <span>
                {m.pinned ? "📌 " : ""}
                {m.when}
              </span>
              {teacher && (
                <button type="button" className="hover:text-primary hover:underline" disabled={pending} onClick={() => apply(() => pinChat(cohortId, m.id, !m.pinned))}>
                  {m.pinned ? "Unpin" : "Pin"}
                </button>
              )}
              {m.canDelete && (
                <button
                  type="button"
                  className="hover:text-danger hover:underline"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(m.mine ? "Remove your message?" : `Remove this message from ${m.author}?`)) apply(() => removeChat(cohortId, m.id));
                  }}
                >
                  Remove
                </button>
              )}
            </p>
          </div>
        ))}
      </div>
      <form
        className="border-t border-line p-3 sm:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
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
                send();
              }
            }}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder="Message the class…"
            className="input min-h-11 resize-none"
            aria-label="Your message"
          />
          <button className="btn-primary" disabled={pending || !draft.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
