import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { GeoPattern } from "@/components/visual/GeoPattern";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <section className="relative overflow-hidden">
      <GeoPattern className="text-silver/50 dark:text-silver/15" id="nf-geo" />
      <Container className="relative flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="font-display bg-gradient-to-br from-silver to-primary bg-clip-text text-8xl font-bold text-transparent sm:text-9xl">
          404
        </p>
        <h1 className="font-display mt-6 text-3xl font-semibold text-ink">{t("title")}</h1>
        <p className="mt-3 max-w-md text-muted">{t("body")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/" icon="arrowRight">
            {t("home")}
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            {t("contact")}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
