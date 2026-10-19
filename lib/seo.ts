import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { locales, routing, type Locale } from "@/i18n/routing";
import { siteConfig } from "@/content/site";

const ogLocales: Record<Locale, string> = {
  en: "en_GB",
  fr: "fr_FR",
  ar: "ar_AE",
  pt: "pt_BR",
};

/** Absolute URL for a locale + path, e.g. ("fr", "/about") -> https://.../fr/about */
export function localeUrl(locale: string, path = "") {
  const clean = path === "/" ? "" : path;
  return `${siteConfig.url}/${locale}${clean}`;
}

/** hreflang alternates for every language, plus x-default. */
export function languageAlternates(path = "") {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localeUrl(l, path);
  languages["x-default"] = localeUrl(routing.defaultLocale, path);
  return languages;
}

/** Builds per-page, per-language metadata with canonical + hreflang + Open Graph. */
export async function pageMetadata({
  locale,
  path,
  title,
  description,
  type = "website",
}: {
  locale: string;
  path: string;
  title?: string;
  description?: string;
  type?: "website" | "article";
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  const desc = description ?? t("description");
  const url = localeUrl(locale, path);
  return {
    title: title ?? { absolute: t("defaultTitle") },
    description: desc,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type,
      url,
      siteName: t("siteName"),
      title: title ?? t("defaultTitle"),
      description: desc,
      locale: ogLocales[locale as Locale] ?? "en_GB",
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? t("defaultTitle"),
      description: desc,
    },
  };
}
