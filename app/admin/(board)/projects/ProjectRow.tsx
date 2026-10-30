"use client";

import { useActionState } from "react";
import { updateProject, type ProjectState } from "../../actions";
import { inputClass } from "@/components/admin/ui";

export function ProjectForm({
  project,
}: {
  project: { id: string; status: "live" | "in-progress"; href?: string; hidden: boolean; featured?: boolean };
}) {
  const [state, action, pending] = useActionState<ProjectState, FormData>(updateProject, {});
  return (
    <form action={action} className="grid gap-4 md:grid-cols-[auto_auto_10rem_1fr_auto] md:items-center">
      <input type="hidden" name="id" value={project.id} />
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input type="checkbox" name="visible" defaultChecked={!project.hidden} className="size-4 accent-[var(--primary)]" />
        Show on site
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input type="checkbox" name="featured" defaultChecked={Boolean(project.featured)} className="size-4 accent-[var(--primary)]" />
        On home page
      </label>
      <select name="status" defaultValue={project.status} aria-label="Status" className={inputClass}>
        <option value="live">Live</option>
        <option value="in-progress">In progress</option>
      </select>
      <input name="href" type="url" defaultValue={project.href ?? ""} placeholder="Link (optional), https://…" aria-label="Link" className={inputClass} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-ink hover:bg-primary/90 disabled:opacity-60">
          {pending ? "Saving…" : "Save"}
        </button>
        {state.ok && !pending && <span className="text-sm font-medium text-success">Saved</span>}
      </div>
      {state.error && <p className="text-sm text-danger md:col-span-5">{state.error}</p>}
    </form>
  );
}
