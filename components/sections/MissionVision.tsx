import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";

export async function MissionVision() {
  const t = await getTranslations("home.missionVision");
  return (
    <Section>
      <div className="grid gap-6 md:grid-cols-2">
        {(["mission", "vision"] as const).map((k) => (
          <figure
            key={k}
            className="cut-corner relative rounded-ss-card bg-surface p-8 ring-1 ring-line sm:p-10"
          >
            <span aria-hidden="true" className="absolute inset-x-8 top-0 h-1 -skew-x-[30deg] bg-primary sm:inset-x-10" />
            <figcaption className="text-sm font-semibold tracking-wide text-primary uppercase">{t(`${k}Label`)}</figcaption>
            <blockquote className="font-display text-balance mt-4 text-xl leading-snug font-medium text-ink sm:text-2xl">
              {t(k)}
            </blockquote>
          </figure>
        ))}
      </div>
    </Section>
  );
}
