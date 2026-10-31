import { getTranslations } from "next-intl/server";
import { getPublicProjects } from "@/lib/projects";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/visual/Reveal";
import { ProjectCardView, toProjectView } from "./ProjectCard";
import { cn } from "@/lib/cn";

export async function FeaturedProjects() {
  const t = await getTranslations();
  const featured = await Promise.all((await getPublicProjects()).filter((p) => p.featured).map(toProjectView));
  return (
    <Section tone="surface" labelledBy="featured-title">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading
          id="featured-title"
          eyebrow={t("home.projects.eyebrow")}
          title={t("home.projects.title")}
          subtitle={t("home.projects.subtitle")}
        />
        <ButtonLink href="/projects" variant="secondary" icon="arrowRight" className="self-start sm:self-auto">
          {t("common.viewAll")}
        </ButtonLink>
      </div>
      <ul className={cn("mt-12 grid gap-6", featured.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {featured.map((p, i) => (
          <li key={p.id}>
            <Reveal delay={i * 0.06} className="h-full">
              <ProjectCardView project={p} />
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
