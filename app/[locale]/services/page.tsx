import { getTranslations, setRequestLocale } from "next-intl/server";
import { serviceIds } from "@/content/site";
import { PageHero } from "@/components/sections/PageHero";
import { CTABand } from "@/components/sections/CTABand";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { IconBadge } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/cn";

export async function generateMetadata({ params }: PageProps<"/[locale]/services">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesPage.meta" });
  return pageMetadata({ locale, path: "/services", title: t("title"), description: t("description") });
}

export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      <PageHero eyebrow={t("servicesPage.hero.eyebrow")} title={t("servicesPage.hero.title")} subtitle={t("servicesPage.hero.subtitle")}>
        <nav aria-label={t("servicesPage.jumpTo")} className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {serviceIds.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name={id} size={16} className="text-primary" />
                  {t(`services.${id}.name`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      {serviceIds.map((id, i) => {
        const deliverables = t.raw(`services.${id}.deliverables`) as string[];
        return (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-title`}
            className={cn("py-16 sm:py-24", i % 2 === 1 && "bg-surface")}
          >
            <Container className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
              <div>
                <IconBadge className="size-14">
                  <Icon name={id} size={28} />
                </IconBadge>
                <h2 id={`${id}-title`} className="font-display mt-6 text-3xl font-semibold text-ink sm:text-4xl">
                  {t(`services.${id}.name`)}
                </h2>
                <p className="mt-4 text-lg text-muted">{t(`services.${id}.short`)}</p>
                <h3 className="mt-8 text-sm font-semibold tracking-wide text-primary uppercase">{t("services.labels.what")}</h3>
                <p className="mt-2 text-ink">{t(`services.${id}.what`)}</p>
                <h3 className="mt-6 text-sm font-semibold tracking-wide text-primary uppercase">{t("services.labels.who")}</h3>
                <p className="mt-2 text-ink">{t(`services.${id}.who`)}</p>
                <ButtonLink
                  href={{ pathname: "/contact", query: { service: id } }}
                  icon="arrowRight"
                  className="mt-8"
                >
                  {t("services.labels.cta", { service: t(`services.${id}.name`) })}
                </ButtonLink>
              </div>
              <div className="cut-corner self-start rounded-ss-card bg-navy p-8 text-white sm:p-10 dark:bg-surface-2">
                <h3 className="text-sm font-semibold tracking-wide text-[#8fc4ff] uppercase">{t("services.labels.deliverables")}</h3>
                <ul className="mt-6 space-y-4">
                  {deliverables.map((d) => (
                    <li key={d} className="flex gap-3">
                      <Icon name="check" size={20} className="mt-0.5 shrink-0 text-[#6bb4ff]" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Container>
          </section>
        );
      })}

      <CTABand />
    </>
  );
}
