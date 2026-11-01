import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { GeoPattern } from "@/components/visual/GeoPattern";
import { HeroVisual } from "@/components/visual/HeroVisual";
import { SocialLinks } from "@/components/ui/SocialLinks";

export async function Hero() {
  const t = await getTranslations();
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <GeoPattern className="text-silver/50 dark:text-silver/20" id="hero-geo" />
      <div
        aria-hidden="true"
        className="absolute -top-40 end-[-10rem] size-[36rem] glow"
      />
      <Container className="relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
        <div>
          <Eyebrow>{t("home.hero.eyebrow")}</Eyebrow>
          <h1
            id="hero-title"
            className="font-display text-balance mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[4rem]"
          >
            {t("home.hero.title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">{t("home.hero.subtitle")}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact" size="lg" icon="arrowRight">
              {t("common.startProject")}
            </ButtonLink>
            <ButtonLink href="/assistant" size="lg" variant="secondary" icon="sparkle" iconPosition="start">
              {t("common.talkToAssistant")}
            </ButtonLink>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <span className="text-sm font-medium text-muted">{t("home.hero.follow")}</span>
            <SocialLinks label={t("home.hero.follow")} newTabLabel={t("a11y.opensInNewTab")} />
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-sm lg:max-w-md">
          <HeroVisual className="h-auto w-full drop-shadow-2xl" />
        </div>
      </Container>
    </section>
  );
}
