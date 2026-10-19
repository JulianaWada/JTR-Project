"use client";

import { useTranslations } from "next-intl";

/** Re-opens the cookie banner so visitors can change their choice. */
export function CookieSettingsButton() {
  const t = useTranslations("consent");
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("jtr:open-consent"))}
      className="transition-colors hover:text-primary"
    >
      {t("manage")}
    </button>
  );
}
