import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublicProjects } from "@/lib/projects";
import { PageHero } from "@/components/sections/PageHero";
import { ProjectFilter } from "@/components/sections/ProjectFilter";
import { toProjectView } from "@/components/sections/ProjectCard";
import { CTABand } from "@/components/sections/CTABand";
import { Section } from "@/components/ui/Section";
import { pageMetadata } from "@/lib/seo";

// Picks up changes made in /admin/projects within a minute (they are also refreshed straight away on save).
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[locale]/projects">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projects.meta" });
  return pageMetadata({ locale, path: "/projects", title: t("title"), description: t("description") });
}

export default async function ProjectsPage({ params }: PageProps<"/[locale]/projects">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projects");
  const views = await Promise.all((await getPublicProjects()).map(toProjectView));
  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} subtitle={t("hero.subtitle")} />
      <Section>
        <ProjectFilter projects={views} />
      </Section>
      <CTABand />
    </>
  );
}
