import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/visual/Reveal";

const items: { id: string; icon: IconName }[] = [
  { id: "insight", icon: "globe" },
  { id: "accessibility", icon: "users" },
  { id: "impact", icon: "target" },
  { id: "remote", icon: "clock" },
];

export async function WhyJTR() {
  const t = await getTranslations("home.why");
  return (
    <Section labelledBy="why-title">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading id="why-title" eyebrow={t("eyebrow")} title={t("title")} />
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {items.map((item, i) => (
            <li key={item.id}>
              <Reveal delay={i * 0.05}>
                <div className="flex items-center gap-3">
                  <span className="inline-grid size-10 -skew-x-12 place-items-center rounded-lg bg-navy text-white dark:bg-primary-soft dark:text-primary">
                    <Icon name={item.icon} size={20} className="skew-x-12" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-ink">{t(`items.${item.id}.title`)}</h3>
                </div>
                <p className="mt-3 text-muted">{t(`items.${item.id}.body`)}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
