import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { getAllSlugs } from "@/lib/blog";
import { languageAlternates, localeUrl } from "@/lib/seo";

const staticPaths = ["", "/about", "/services", "/projects", "/insights", "/careers", "/contact", "/assistant", "/privacy", "/terms"];

/** One entry per page per language, each listing its translations (hreflang). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs();
  const paths = [...staticPaths, ...slugs.map((s) => `/insights/${s}`)];
  const now = new Date();
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: now,
      changeFrequency: path === "" || path === "/insights" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/services" || path === "/contact" ? 0.9 : 0.7,
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
