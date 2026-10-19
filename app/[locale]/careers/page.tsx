import { getTranslations, setRequestLocale } from "next-intl/server";
import { siteConfig } from "@/content/site";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card, IconBadge } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ButtonAnchor } from "@/components/ui/Button";
import { pageMetadata } from "@/lib/seo";

const cultureIcons: IconName[] = ["globe", "bulb", "target"];

export async function generateMetadata({ params }: PageProps<"/[locale]/careers">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "careers.meta" });
  return pageMetadata({ locale, path: "/careers", title: t("title"), description: t("description") });
}

export default async function CareersPage({ params }: PageProps<"/[locale]/careers">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("careers");
  const culture = t.raw("culture.items") as { title: string; body: string }[];

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} />
      <Section labelledBy="culture-title">
        <SectionHeading id="culture-title" title={t("culture.title")} />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {culture.map((c, i) => (
            <li key={c.title}>
              <Card className="h-full">
                <IconBadge>
                  <Icon name={cultureIcons[i] ?? "star"} size={22} />
                </IconBadge>
                <h3 className="font-display mt-5 text-lg font-semibold text-ink">{c.title}</h3>
                <p className="mt-2 text-muted">{c.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
      <Section tone="surface" labelledBy="openings-title">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto inline-grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
            <Icon name="briefcase" size={26} />
          </span>
          <h2 id="openings-title" className="font-display mt-5 text-3xl font-semibold text-ink">
            {t("openings.title")}
          </h2>
          <p className="mt-3 text-lg font-medium text-ink">{t("openings.none")}</p>
          <p className="mt-2 text-muted">{t("openings.sendCv")}</p>
          <ButtonAnchor href={`mailto:${siteConfig.contact.careersEmail}`} external={false} icon="mail" iconPosition="start" className="mt-7">
            {t("openings.cta")}
          </ButtonAnchor>
        </div>
      </Section>
    </>
  );
}
