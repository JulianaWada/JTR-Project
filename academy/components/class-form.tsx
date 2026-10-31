import { saveClass } from "@/app/teach/actions";
import type { classes } from "@/lib/db/schema";
import { resourcesToText } from "@/lib/quiz-format";
import { toLagosParts } from "@/lib/time";

export function ClassForm({
  cohortId,
  lesson,
  defaults,
  selfPaced = false,
}: {
  cohortId: string;
  lesson?: typeof classes.$inferSelect;
  defaults?: { week: number; date: string };
  /** A video lesson of a recorded course: no date, time or Meet link. */
  selfPaced?: boolean;
}) {
  const when = lesson ? toLagosParts(lesson.startsAt) : { date: defaults?.date ?? "", time: "19:00" };
  return (
    <form action={saveClass.bind(null, cohortId, lesson?.id ?? null)} className="card space-y-4">
      <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
        <div>
          <label className="label" htmlFor="week">
            {selfPaced ? "Lesson" : "Week"}
          </label>
          <input className="input" id="week" name="week" type="number" min={1} defaultValue={lesson?.week ?? defaults?.week ?? 1} />
        </div>
        <div>
          <label className="label" htmlFor="title">
            Title
          </label>
          <input className="input" id="title" name="title" defaultValue={lesson?.title} required />
        </div>
      </div>
      {selfPaced ? (
        <div>
          <label className="label" htmlFor="recordingUrl">
            Video link <span className="font-normal text-muted">(YouTube unlisted, Vimeo, Loom or Google Drive; it plays inside the lesson page)</span>
          </label>
          <input
            className="input"
            id="recordingUrl"
            name="recordingUrl"
            type="url"
            defaultValue={lesson?.recordingUrl ?? ""}
            placeholder="https://youtu.be/…"
          />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="date">
                Date
              </label>
              <input className="input" id="date" name="date" type="date" defaultValue={when.date} required />
            </div>
            <div>
              <label className="label" htmlFor="time">
                Time (Lagos)
              </label>
              <input className="input" id="time" name="time" type="time" defaultValue={when.time} required />
            </div>
            <div>
              <label className="label" htmlFor="duration">
                Minutes
              </label>
              <input className="input" id="duration" name="duration" type="number" min={15} step={15} defaultValue={lesson?.durationMinutes ?? 90} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="meetUrl">
                Meet link <span className="font-normal text-muted">(leave empty to use the intake&apos;s link)</span>
              </label>
              <input className="input" id="meetUrl" name="meetUrl" type="url" defaultValue={lesson?.meetUrl ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="recordingUrl">
                Recording link <span className="font-normal text-muted">(Google Drive or YouTube unlisted)</span>
              </label>
              <input className="input" id="recordingUrl" name="recordingUrl" type="url" defaultValue={lesson?.recordingUrl ?? ""} />
            </div>
          </div>
        </>
      )}
      <div>
        <label className="label" htmlFor="notes">
          Lesson notes <span className="font-normal text-muted">(## for headings, - for bullets, **bold**). The AI tutor learns from these.</span>
        </label>
        <textarea className="input min-h-80 font-mono text-xs leading-relaxed" id="notes" name="notes" defaultValue={lesson?.notes ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="resources">
          Links and files <span className="font-normal text-muted">(one per line: Label | https://…)</span>
        </label>
        <textarea className="input min-h-20 font-mono text-xs" id="resources" name="resources" defaultValue={lesson ? resourcesToText(lesson.resources) : ""} />
      </div>
      <button className="btn-primary">{selfPaced ? "Save lesson" : "Save class"}</button>
    </form>
  );
}
