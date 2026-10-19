"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MAX_MESSAGE_LENGTH } from "@/lib/assistant/config";
import { siteConfig } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { useChat } from "./useChat";
import { MessageText } from "./MessageText";

export function ChatPanel({ variant, onClose }: { variant: "widget" | "page"; onClose?: () => void }) {
  const t = useTranslations("assistant");
  const { messages, status, error, leadSaved, send, stop } = useChat();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = t.raw("suggestions") as string[];
  const tooLong = input.length > MAX_MESSAGE_LENGTH;
  const streaming = status === "streaming";

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, error]);

  useEffect(() => {
    if (variant === "widget") inputRef.current?.focus();
  }, [variant]);

  const submit = (text = input) => {
    if (!text.trim() || tooLong || streaming) return;
    void send(text);
    setInput("");
  };

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-surface",
        variant === "widget" ? "h-full" : "h-[min(75vh,46rem)] rounded-card border border-line shadow-xl shadow-primary/5",
      )}
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="inline-grid size-9 place-items-center rounded-full bg-navy text-white dark:bg-primary-soft dark:text-primary">
          <Icon name="sparkle" size={18} />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-base font-semibold text-ink" id={`chat-title-${variant}`}>
            {t("name")}
          </h2>
          <p className="text-xs text-muted">{t("disclaimer")}</p>
        </div>
        {variant === "widget" && (
          <>
            <Link
              href="/assistant"
              onClick={onClose}
              className="inline-grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
              aria-label={t("expand")}
              title={t("expand")}
            >
              <Icon name="expand" size={18} />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
              aria-label={t("close")}
            >
              <Icon name="close" size={20} />
            </button>
          </>
        )}
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite" aria-busy={streaming}>
        <div className="max-w-[85%] rounded-2xl rounded-ss-sm bg-surface-2 px-4 py-3 text-sm text-ink">{t("intro")}</div>

        {messages.length === 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={t("pageTitle")}>
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-full border border-line bg-bg px-3 py-1.5 text-start text-sm text-ink transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} dir="auto" className="ms-auto w-fit max-w-[85%] rounded-2xl rounded-se-sm bg-primary px-4 py-3 text-sm whitespace-pre-wrap text-primary-ink">
              {m.content}
            </div>
          ) : (
            <div key={i} dir="auto" className="w-fit max-w-[90%] rounded-2xl rounded-ss-sm bg-surface-2 px-4 py-3 text-sm text-ink">
              {m.content ? (
                <MessageText text={m.content} />
              ) : (
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="sr-only">{t("thinking")}</span>
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      aria-hidden="true"
                      className="size-1.5 animate-bounce rounded-full bg-muted"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                </span>
              )}
            </div>
          ),
        )}

        {leadSaved && (
          <p role="status" className="flex items-center gap-2 text-sm font-medium text-success">
            <Icon name="check" size={16} />
            {t("leadSaved")}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink">
            {error === "rate_limited"
              ? t("rateLimited")
              : error === "too_long"
                ? t("tooLong", { max: MAX_MESSAGE_LENGTH })
                : t("fallback", { email: siteConfig.contact.email })}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-line p-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-bg p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
          <label htmlFor={`chat-input-${variant}`} className="sr-only">
            {t("placeholder")}
          </label>
          <textarea
            id={`chat-input-${variant}`}
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t("placeholder")}
            aria-invalid={tooLong || undefined}
            aria-describedby={tooLong ? `chat-too-long-${variant}` : undefined}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="inline-grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink hover:bg-line"
              aria-label={t("stop")}
            >
              <Icon name="stop" size={18} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || tooLong}
              className="inline-grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-ink transition-opacity disabled:opacity-40"
              aria-label={t("send")}
            >
              <Icon name="send" size={18} className="rtl:-scale-x-100" />
            </button>
          )}
        </div>
        {tooLong && (
          <p id={`chat-too-long-${variant}`} className="mt-2 px-1 text-xs text-danger">
            {t("tooLong", { max: MAX_MESSAGE_LENGTH })}
          </p>
        )}
      </form>
    </div>
  );
}
