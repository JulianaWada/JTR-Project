import Image from "next/image";
import Link from "next/link";
import en from "@/messages/en.json";
import { PageTitle, Panel, Pill, statusTone } from "@/components/admin/ui";
import { getAllProjects } from "@/lib/projects";
import { moveProject } from "../../actions";
import { ProjectForm } from "./ProjectRow";

export const metadata = { title: "Projects" };

const items = en.projects.items as Record<string, { title: string; summary: string }>;

export default async function ProjectsAdminPage() {
  const projects = await getAllProjects();
  return (
    <>
      <PageTitle
        title="Projects"
        subtitle="Choose which projects appear on the website, in what order, and whether they're live. Titles and descriptions in the four languages are still edited in the code (ask Claude to add or reword a project)."
        actions={
          <Link href="/en/projects" className="text-sm font-semibold text-primary">
            View projects page
          </Link>
        }
      />
      <div className="space-y-4">
        {projects.map((p, i) => (
          <Panel key={p.id} className={p.hidden ? "opacity-70" : undefined}>
            <div className="flex flex-col gap-4 p-5 sm:flex-row">
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-40">
                {p.image ? <Image src={p.image} alt="" fill sizes="160px" className="object-cover" /> : <span className="absolute inset-0 grid place-items-center text-xs text-muted">Artwork</span>}
              </div>
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-ink">{items[p.id]?.title ?? p.id}</h2>
                      <Pill tone={statusTone(p.status)}>{p.status === "live" ? "Live" : "In progress"}</Pill>
                      {p.hidden && <Pill>Hidden</Pill>}
                      {p.featured && !p.hidden && <Pill tone="blue">Home page</Pill>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{items[p.id]?.summary}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {(["up", "down"] as const).map((direction) => (
                      <form key={direction} action={moveProject}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="direction" value={direction} />
                        <button
                          type="submit"
                          disabled={direction === "up" ? i === 0 : i === projects.length - 1}
                          aria-label={`Move ${items[p.id]?.title ?? p.id} ${direction}`}
                          className="grid size-9 place-items-center rounded-full border border-line text-ink hover:border-primary hover:text-primary disabled:opacity-30"
                        >
                          {direction === "up" ? "↑" : "↓"}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
                <ProjectForm project={p} />
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
