import { getTranslations } from "next-intl/server";
import type { RegionId, ServiceId } from "@/content/site";
import { Badge } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ProjectArt } from "@/components/visual/ProjectArt";

export type ProjectView = {
  id: string;
  service: ServiceId;
  region: RegionId;
  year: number;
  title: string;
  summary: string;
  serviceName: string;
  regionName: string;
};

/** Plain presentational card, shared by the server-rendered home page and the client-side filter grid. */
export function ProjectCardView({ project, placeholderLabel }: { project: ProjectView; placeholderLabel: string }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition hover:border-primary/60">
      <div className="relative aspect-[16/10] overflow-hidden bg-navy">
        <ProjectArt seed={project.id} service={project.service} />
        <span className="absolute start-4 top-4 inline-grid size-10 place-items-center rounded-lg bg-white/10 text-white backdrop-blur">
          <Icon name={project.service} size={20} />
        </span>
        <span className="absolute end-4 top-4 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {placeholderLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-2">
          <Badge>{project.serviceName}</Badge>
          <Badge>{project.regionName}</Badge>
        </div>
        <h3 className="font-display mt-4 text-lg font-semibold text-ink">{project.title}</h3>
        <p className="mt-2 flex-1 text-sm text-muted">{project.summary}</p>
      </div>
    </article>
  );
}

export async function toProjectView(p: { id: string; service: ServiceId; region: RegionId; year: number }): Promise<ProjectView> {
  const t = await getTranslations();
  return {
    ...p,
    title: t(`projects.items.${p.id}.title`),
    summary: t(`projects.items.${p.id}.summary`),
    serviceName: t(`services.${p.service}.name`),
    regionName: t(`regions.${p.region}`),
  };
}
