"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, locales, type Locale } from "@/i18n/routing";
import { Icon } from "@/components/ui/Icon";

const STORAGE_KEY = "jtr-locale-choice";

/**
 * Suggests (never forces) a language that matches the visitor's browser settings.
 * Hidden once the visitor picks a language or dismisses it.
 */
export function LocaleSuggestion() {
  const t = useTranslations("localeSuggestion");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [suggested, setSuggested] = useState<Locale | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const preferred = (navigator.languages ?? [navigator.language])
      .map((l) => l.toLowerCase().split("-")[0])
      .find((l) => (locales as readonly string[]).includes(l)) as Locale | undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser language is only known on the client
    if (preferred && preferred !== locale) setSuggested(preferred);
  }, [locale]);

  if (!suggested) return null;

  const remember = (choice: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {}
    setSuggested(null);
  };

  return (
    // Fixed overlay so it never pushes the page down after load (no layout shift).
    <div
      role="region"
      aria-label={localeNames[suggested]}
      lang={suggested}
      className="fixed inset-x-3 top-20 z-[45] mx-auto max-w-xl rounded-card border border-line bg-surface shadow-xl shadow-black/10"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
        <p className="flex items-center gap-2 text-ink">
          <Icon name="globe" size={16} className="text-primary" />
          {t("message", { language: localeNames[suggested] })}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={pathname}
            locale={suggested}
            onClick={() => remember(suggested)}
            className="rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-ink"
          >
            {t("switch", { language: localeNames[suggested] })}
          </Link>
          <button
            type="button"
            onClick={() => remember(locale)}
            className="rounded-full px-3 py-1.5 font-medium text-muted hover:text-ink"
          >
            {t("dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
