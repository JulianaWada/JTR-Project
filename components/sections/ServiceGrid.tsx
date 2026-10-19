import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { serviceIds } from "@/content/site";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card, IconBadge } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/visual/Reveal";
import { cn } from "@/lib/cn";

export async function ServiceGrid() {
  const t = await getTranslations();
  return (
    <Section tone="surface" labelledBy="services-title">
      <SectionHeading
        id="services-title"
        eyebrow={t("home.services.eyebrow")}
        title={t("home.services.title")}
        subtitle={t("home.services.subtitle")}
      />
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {serviceIds.map((id, i) => (
          <li key={id} className={cn("lg:col-span-2", i >= 3 && "lg:col-span-3")}>
            <Reveal delay={i * 0.05} className="h-full">
              <Card interactive className="group flex h-full flex-col bg-bg">
                <IconBadge>
                  <Icon name={id} size={24} />
                </IconBadge>
                <h3 className="font-display mt-5 text-xl font-semibold text-ink">
                  <Link href={`/services#${id}`} className="after:absolute after:inset-0 after:rounded-card">
                    {t(`services.${id}.name`)}
                  </Link>
                </h3>
                <p className="mt-3 flex-1 text-muted">{t(`services.${id}.short`)}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {t("common.learnMore")}
                  <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                </span>
              </Card>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
