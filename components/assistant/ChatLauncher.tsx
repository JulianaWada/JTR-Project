"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Icon } from "@/components/ui/Icon";

type PanelProps = { variant: "widget" | "page"; onClose?: () => void };

/**
 * Floating chat button. The chat panel itself (and its code) only loads
 * when a visitor opens it, keeping every page light.
 */
export function ChatLauncher() {
  const t = useTranslations("assistant");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [Panel, setPanel] = useState<ComponentType<PanelProps> | null>(null);

  const openChat = async () => {
    if (!Panel) {
      const mod = await import("./ChatPanel");
      setPanel(() => mod.ChatPanel);
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The full-screen assistant page has its own chat.
  if (pathname === "/assistant") return null;

  return (
    <>
      {open && Panel && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-title-widget"
          className="fixed inset-x-3 bottom-3 z-50 h-[min(36rem,calc(100dvh-1.5rem))] overflow-hidden rounded-card border border-line shadow-2xl shadow-black/20 sm:inset-x-auto sm:end-5 sm:bottom-5 sm:w-[24rem]"
        >
          <Panel variant="widget" onClose={() => setOpen(false)} />
        </div>
      )}
      {!open && (
        <button
          type="button"
          onClick={openChat}
          onMouseEnter={() => void import("./ChatPanel")}
          onFocus={() => void import("./ChatPanel")}
          className="fixed end-5 bottom-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-primary ps-4 pe-5 font-semibold text-primary-ink shadow-xl shadow-primary/30 transition-transform hover:-translate-y-0.5"
          aria-label={t("open")}
        >
          <Icon name="chat" size={22} />
          <span className="hidden sm:inline">{t("name")}</span>
        </button>
      )}
    </>
  );
}
