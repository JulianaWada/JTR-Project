"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("a11y");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="language-menu"
        aria-label={`${t("changeLanguage")}. ${t("currentLanguage", { language: localeNames[locale] })}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <Icon name="globe" size={18} />
        <span className="uppercase">{locale}</span>
      </button>
      {open && (
        <ul
          id="language-menu"
          className="absolute end-0 top-12 z-50 min-w-44 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl"
        >
          {locales.map((l) => (
            <li key={l}>
              <Link
                href={pathname}
                locale={l}
                lang={l}
                hrefLang={l}
                aria-current={l === locale ? "true" : undefined}
                onClick={() => {
                  setOpen(false);
                  try {
                    localStorage.setItem("jtr-locale-choice", l);
                  } catch {}
                }}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-2",
                  l === locale ? "font-semibold text-primary" : "text-ink",
                )}
              >
                {localeNames[l]}
                {l === locale && <Icon name="check" size={16} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
