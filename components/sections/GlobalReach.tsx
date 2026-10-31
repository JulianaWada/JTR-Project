import { getFormatter, getTranslations } from "next-intl/server";
import { reachFigures, regionIds } from "@/content/site";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WorldClocks } from "./WorldClocks";

export async function GlobalReach({ headingLevel = "h2" }: { headingLevel?: "h2" }) {
  const t = await getTranslations();
  const format = await getFormatter();
  const steps = t.raw("home.reach.model.steps") as string[];
  const cities = t.raw("home.reach.cities") as Record<string, string>;

  return (
    <Section tone="navy" labelledBy="reach-title" className="overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(59,155,255,0.18),transparent_45%)] rtl:bg-[radial-gradient(circle_at_15%_20%,rgba(59,155,255,0.18),transparent_45%)]"
      />
      <div className="relative">
        <SectionHeading
          id="reach-title"
          as={headingLevel}
          eyebrow={t("home.reach.eyebrow")}
          title={t("home.reach.title")}
          subtitle={t("home.reach.subtitle")}
        />
        {/* TODO: replace placeholder figures in content/site.ts (reachFigures). */}
        <dl className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
          {reachFigures.map((f) => (
            <div key={f.id} className="bg-navy p-6">
              <dt className="text-sm text-muted">{t(`home.reach.figures.${f.id}`)}</dt>
              <dd className="font-display mt-2 text-4xl font-semibold text-ink tabular-nums">
                <span dir="ltr" className="[unicode-bidi:isolate]">
                  {format.number(f.value)}
                  <span className="text-primary">{f.suffix}</span>
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">{t("home.reach.figuresNote")}</p>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">{t("home.reach.markets")}</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {regionIds.map((r) => (
                <li key={r} className="rounded-full border border-line px-4 py-2 text-sm text-ink">
                  {t(`regions.${r}`)}
                </li>
              ))}
            </ul>
            <h3 className="font-display mt-8 text-lg font-semibold text-ink">{t("home.reach.clocks")}</h3>
            <div className="mt-4">
              <WorldClocks labels={cities} />
            </div>
          </div>
          <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
            <h3 className="font-display text-lg font-semibold text-ink">{t("home.reach.model.title")}</h3>
            <ol className="mt-5 space-y-4">
              {steps.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="font-display inline-grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-ink">
                    {format.number(i + 1)}
                  </span>
                  <span className="pt-1 text-ink">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Section>
  );
}
