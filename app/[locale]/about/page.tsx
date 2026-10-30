import { getTranslations, setRequestLocale } from "next-intl/server";
import { valueIds } from "@/content/site";
import { PageHero } from "@/components/sections/PageHero";
import { MissionVision } from "@/components/sections/MissionVision";
import { GlobalReach } from "@/components/sections/GlobalReach";
import { CTABand } from "@/components/sections/CTABand";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card, IconBadge } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/visual/Reveal";
import { pageMetadata } from "@/lib/seo";

const valueIcons: Record<(typeof valueIds)[number], IconName> = {
  innovation: "bulb",
  accessibility: "users",
  impact: "target",
  integrity: "shield",
  excellence: "star",
};

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });
  return pageMetadata({ locale, path: "/about", title: t("title"), description: t("description") });
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const paragraphs = t.raw("story.paragraphs") as string[];

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} />

      <Section labelledBy="story-title">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <h2 id="story-title" className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            {t("story.title")}
          </h2>
          <div className="space-y-5 text-lg text-muted">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
      </Section>

      <MissionVision />

      <Section tone="surface" labelledBy="values-title">
        <SectionHeading id="values-title" eyebrow={t("values.eyebrow")} title={t("values.title")} />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {valueIds.map((id, i) => (
            <li key={id}>
              <Reveal delay={i * 0.05} className="h-full">
                <Card className="h-full bg-bg">
                  <IconBadge>
                    <Icon name={valueIcons[id]} size={22} />
                  </IconBadge>
                  <h3 className="font-display mt-5 text-lg font-semibold text-ink">{t(`values.items.${id}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted">{t(`values.items.${id}.body`)}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <GlobalReach />

      <CTABand />
    </>
  );
}
