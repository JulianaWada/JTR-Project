import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { Readex_Pro, IBM_Plex_Sans } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isRtl, routing } from "@/i18n/routing";
import { siteConfig } from "@/content/site";
import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocaleSuggestion } from "@/components/layout/LocaleSuggestion";
import { ChatLauncher } from "@/components/assistant/ChatLauncher";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { cn } from "@/lib/cn";
import "../globals.css";

// Readex Pro for headings. Only the Latin file is preloaded here (French and Portuguese accents are in it);
// the Arabic file is self-hosted in /public/fonts and preloaded on Arabic pages only.
const heading = Readex_Pro({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

// IBM Plex Sans for Latin body text. IBM Plex Sans Arabic is self-hosted in /public/fonts (see globals.css)
// so Arabic pages can preload it without slowing down the other languages.
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#07111f" },
  ],
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t("defaultTitle"), template: t("titleTemplate") },
    description: t("description"),
    applicationName: t("siteName"),
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (isRtl(locale)) {
    // The fonts for Arabic headings and body text, so the first Arabic paint uses them.
    for (const file of ["readex-pro-arabic", "ibm-plex-sans-arabic-400"]) {
      preload(`/fonts/${file}.woff2`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
    }
  }
  const t = await getTranslations("a11y");
  const meta = await getTranslations("meta");

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.legalName,
    alternateName: [siteConfig.name, siteConfig.shortName],
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/jtr-emblem.png`,
    description: meta("description"),
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.headquarters.city,
      addressRegion: siteConfig.headquarters.region,
      addressCountry: siteConfig.headquarters.countryCode,
    },
    areaServed: "Worldwide",
    knowsLanguage: routing.locales,
    sameAs: siteConfig.social.map((s) => s.href),
  };

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={cn(heading.variable, body.variable, "antialiased")}
    >
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
        <a
          href="#main"
          className="sr-only z-[60] rounded-full bg-primary px-4 py-2 font-semibold text-primary-ink focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <Providers>
            <LocaleSuggestion />
            <Header />
            <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <Footer />
            <ChatLauncher />
            <CookieConsent />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
