import "server-only";
import { projects as codeProjects, type ProjectStatus } from "@/content/site";
import type { ProjectSettingsRow } from "@/lib/db/schema";

export type Project = (typeof codeProjects)[number] & { hidden: boolean; sortOrder: number };

/** Admin changes saved in the database, or none if it is unavailable (e.g. while the site is being built). */
async function loadSettings(): Promise<ProjectSettingsRow[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") return [];
  try {
    const { getDb, schema } = await import("@/lib/db");
    return await (await getDb()).select().from(schema.projectSettings);
  } catch (err) {
    console.error("[projects] could not load admin settings, using the defaults in content/site.ts", err);
    return [];
  }
}

/** Every project in content/site.ts with the admin board's changes applied, in display order. */
export async function getAllProjects(): Promise<Project[]> {
  const settings = new Map((await loadSettings()).map((s) => [s.projectId, s]));
  return codeProjects
    .map((p, i) => {
      const s = settings.get(p.id);
      return {
        ...p,
        status: (s?.status ?? p.status) as ProjectStatus,
        featured: s?.featured ?? p.featured,
        href: s?.href === null || s?.href === undefined ? p.href : s.href || undefined,
        hidden: s?.hidden ?? false,
        sortOrder: s?.sortOrder ?? i,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** The projects visitors see. */
export async function getPublicProjects(): Promise<Project[]> {
  return (await getAllProjects()).filter((p) => !p.hidden);
}
