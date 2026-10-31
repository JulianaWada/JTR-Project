import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { AcademyInterestForm } from "@/components/forms/AcademyInterestForm";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/academy/interest">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "academyInterest.meta" });
  return pageMetadata({ locale, path: "/academy/interest", title: t("title"), description: t("description") });
}

export default async function AcademyInterestPage({ params }: PageProps<"/[locale]/academy/interest">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("academyInterest");

  const courses: { id: "sales" | "animation"; icon: IconName }[] = [
    { id: "sales", icon: "trendingUp" },
    { id: "animation", icon: "video" },
  ];
  const perks = ["live", "certificate", "badge"] as const;

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-6 sm:p-10">
            <h2 className="font-display text-2xl font-semibold text-ink">{t("form.title")}</h2>
            <p className="mt-2 text-muted">{t("form.intro")}</p>
            <div className="relative mt-8">
              <AcademyInterestForm />
            </div>
          </Card>

          <aside aria-labelledby="courses-title" className="flex flex-col gap-6">
            <h2 id="courses-title" className="font-display text-xl font-semibold text-ink">
              {t("courses.title")}
            </h2>
            <ul className="flex flex-col gap-3">
              {courses.map((c) => (
                <li key={c.id} className="flex items-start gap-4 rounded-xl border border-line bg-surface p-4">
                  <span className="inline-grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Icon name={c.icon} size={20} />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{t(`courses.${c.id}.name`)}</span>
                    <span className="mt-1 block text-sm text-muted">{t(`courses.${c.id}.summary`)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="cut-corner rounded-ss-card bg-navy p-7 text-white dark:bg-surface-2">
              <ul className="flex flex-col gap-3">
                {perks.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <Icon name="check" size={18} className="text-[#6bb4ff]" />
                    {t(`perks.${p}`)}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-white/75">{t("perks.note")}</p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
