import { getTranslations, setRequestLocale } from "next-intl/server";
import { siteConfig } from "@/content/site";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ButtonAnchor } from "@/components/ui/Button";
import { ContactForm } from "@/components/forms/ContactForm";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.meta" });
  return pageMetadata({ locale, path: "/contact", title: t("title"), description: t("description") });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { contact, headquarters } = siteConfig;

  const channels: { icon: IconName; label: string; value: string; href: string; ltr?: boolean; external?: boolean }[] = [
    { icon: "mail", label: t("contact.channels.email"), value: contact.email, href: `mailto:${contact.email}`, ltr: true },
    { icon: "phone", label: t("contact.channels.phone"), value: contact.phone, href: contact.phoneHref, ltr: true },
    { icon: "whatsapp", label: t("contact.channels.whatsapp"), value: `+${contact.whatsapp}`, href: `https://wa.me/${contact.whatsapp}`, ltr: true, external: true },
  ];

  return (
    <>
      <PageHero eyebrow={t("contact.hero.eyebrow")} title={t("contact.hero.title")} subtitle={t("contact.hero.subtitle")} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-6 sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-ink">{t("contact.form.title")}</h2>
            <div className="relative mt-8">
              <ContactForm />
            </div>
          </Card>

          <aside aria-labelledby="channels-title" className="flex flex-col gap-6">
            <h2 id="channels-title" className="font-display text-xl font-semibold text-ink">
              {t("contact.channels.title")}
            </h2>

            <div className="cut-corner rounded-ss-card bg-navy p-7 text-white dark:bg-surface-2">
              <p className="flex items-center gap-2 font-display text-lg font-semibold">
                <Icon name="calendar" size={20} className="text-[#6bb4ff]" />
                {t("contact.channels.book")}
              </p>
              <p className="mt-2 text-sm text-white/75">{t("contact.channels.bookNote")}</p>
              {/* TODO: siteConfig.bookingUrl is a placeholder Cal.com link. */}
              <ButtonAnchor href={siteConfig.bookingUrl} variant="light" className="mt-5" icon="arrowUpRight" newTabLabel={t("a11y.opensInNewTab")}>
                {t("nav.bookCall")}
              </ButtonAnchor>
            </div>

            <ul className="flex flex-col gap-3">
              {channels.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-primary"
                  >
                    <span className="inline-grid size-11 place-items-center rounded-lg bg-primary-soft text-primary">
                      <Icon name={c.icon} size={20} />
                    </span>
                    <span>
                      <span className="block text-sm text-muted">{c.label}</span>
                      <span className="block font-medium text-ink" dir={c.ltr ? "ltr" : undefined}>
                        {c.value}
                      </span>
                    </span>
                    {c.external && <span className="sr-only">{t("a11y.opensInNewTab")}</span>}
                  </a>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-line bg-surface p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="mapPin" size={18} className="text-primary" />
                {t("contact.channels.hq")}
              </p>
              {/* TODO: real office address in content/site.ts (siteConfig.headquarters). */}
              <address className="mt-2 text-muted not-italic">
                {/* The street line stays hidden until a real address replaces the placeholder. */}
                {!headquarters.street.startsWith("TODO") && (
                  <>
                    {headquarters.street}
                    <br />
                  </>
                )}
                {headquarters.city}, {headquarters.country}
              </address>
              <div className="mt-4 aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface-2">
                {siteConfig.mapEmbedUrl ? (
                  <iframe
                    title={t("contact.channels.mapTitle")}
                    src={siteConfig.mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full w-full border-0"
                  />
                ) : (
                  <div className="relative grid h-full place-items-center text-sm text-muted">
                    <svg aria-hidden="true" className="absolute inset-0 h-full w-full text-silver/40">
                      <defs>
                        <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                          <path d="M24 0H0v24" fill="none" stroke="currentColor" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#map-grid)" />
                    </svg>
                    <span className="relative flex flex-col items-center gap-2">
                      <Icon name="mapPin" size={28} className="text-primary" />
                      {t("contact.channels.mapPlaceholder")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
