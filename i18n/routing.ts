import { defineRouting } from "next-intl/routing";

export const locales = ["en", "fr", "ar", "pt"] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: readonly Locale[] = ["ar"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
  pt: "Português",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  // We suggest a language from the browser instead of forcing a redirect
  // (see components/layout/LocaleSuggestion.tsx).
  localeDetection: false,
});

export function isRtl(locale: string) {
  return rtlLocales.includes(locale as Locale);
}
