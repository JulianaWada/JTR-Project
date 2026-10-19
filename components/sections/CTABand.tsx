import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { ButtonAnchor, ButtonLink } from "@/components/ui/Button";
import { GeoPattern } from "@/components/visual/GeoPattern";

export async function CTABand() {
  const t = await getTranslations();
  return (
    <section aria-labelledby="cta-title" className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="dark relative mx-auto max-w-site overflow-hidden rounded-[2rem] bg-navy px-6 py-14 text-center sm:px-12 sm:py-20">
        <GeoPattern className="text-silver/20" id="cta-geo" />
        <div aria-hidden="true" className="absolute -bottom-32 start-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        <Container className="relative">
          <h2 id="cta-title" className="font-display text-balance mx-auto max-w-2xl text-3xl font-semibold text-ink sm:text-4xl">
            {t("home.cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t("home.cta.subtitle")}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/contact" size="lg" icon="arrowRight">
              {t("common.startProject")}
            </ButtonLink>
            <ButtonAnchor href={siteConfig.bookingUrl} size="lg" variant="secondary" icon="calendar" iconPosition="start" newTabLabel={t("a11y.opensInNewTab")}>
              {t("common.bookCall")}
            </ButtonAnchor>
            <ButtonAnchor
              href={`https://wa.me/${siteConfig.contact.whatsapp}`}
              size="lg"
              variant="ghost"
              icon="whatsapp"
              iconPosition="start"
              newTabLabel={t("a11y.opensInNewTab")}
            >
              {t("home.cta.whatsapp")}
            </ButtonAnchor>
          </div>
        </Container>
      </div>
    </section>
  );
}
