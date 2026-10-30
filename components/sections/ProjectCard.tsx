import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ProjectStatus, RegionId, ServiceId } from "@/content/site";
import { Badge } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ProjectArt } from "@/components/visual/ProjectArt";

export type ProjectView = {
  id: string;
  service: ServiceId;
  region: RegionId;
  year: number;
  status: ProjectStatus;
  image?: string;
  href?: string;
  title: string;
  summary: string;
  imageAlt: string;
  statusName: string;
  serviceName: string;
  regionName: string;
  linkLabel: string;
};

/** Plain presentational card, shared by the server-rendered home page and the client-side filter grid. */
export function ProjectCardView({ project }: { project: ProjectView }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition hover:border-primary/60">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy">
        {project.image ? (
          <Image
            src={project.image}
            alt={project.imageAlt}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <ProjectArt seed={project.id} service={project.service} />
        )}
        <span className="absolute start-4 top-4 inline-grid size-10 place-items-center rounded-lg bg-navy/70 text-white backdrop-blur">
          <Icon name={project.service} size={20} />
        </span>
        <span className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-navy/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          <span
            aria-hidden
            className={project.status === "live" ? "size-1.5 rounded-full bg-emerald-400" : "size-1.5 rounded-full bg-amber-400"}
          />
          {project.statusName}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-2">
          <Badge>{project.serviceName}</Badge>
          <Badge>{project.regionName}</Badge>
        </div>
        <h3 className="font-display mt-4 text-lg font-semibold text-ink">{project.title}</h3>
        <p className="mt-2 flex-1 text-sm text-muted">{project.summary}</p>
        {project.href && (
          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline"
          >
            {project.linkLabel}
            <Icon name="arrowRight" size={16} className="rtl:-scale-x-100" />
          </a>
        )}
      </div>
    </article>
  );
}

export async function toProjectView(p: {
  id: string;
  service: ServiceId;
  region: RegionId;
  year: number;
  status: ProjectStatus;
  image?: string;
  href?: string;
}): Promise<ProjectView> {
  const t = await getTranslations();
  return {
    id: p.id,
    service: p.service,
    region: p.region,
    year: p.year,
    status: p.status,
    image: p.image,
    href: p.href,
    title: t(`projects.items.${p.id}.title`),
    summary: t(`projects.items.${p.id}.summary`),
    imageAlt: p.image ? t(`projects.items.${p.id}.imageAlt`) : "",
    statusName: t(`projects.status.${p.status}`),
    linkLabel: t("projects.visit"),
    serviceName: t(`services.${p.service}.name`),
    regionName: t(`regions.${p.region}`),
  };
}
