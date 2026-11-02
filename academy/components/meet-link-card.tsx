import Link from "next/link";
import { saveMeetLink } from "@/app/teach/actions";
import { Pill } from "@/components/ui";
import type { liveIntakes } from "@/lib/meet-links";
import { formatDate, formatTime } from "@/lib/time";

type Intake = Awaited<ReturnType<typeof liveIntakes>>[number];

/** One live intake with a box to paste or change its Google Meet link. */
export function MeetLinkCard({ intake, returnTo }: { intake: Intake; returnTo: string }) {
  const { cohort, course, classes } = intake;
  const missing = !cohort.meetUrl;
  const first = intake.firstClass;
  const last = classes.at(-1)?.startsAt ?? first;
  const sameDay = formatDate(first) === formatDate(last);
  return (
    <section className={`card ${missing ? "border-warning/50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-ink">{course.title}</h2>
          <p className="mt-1 text-sm text-muted">
            <Link href={`/teach/cohorts/${cohort.id}`} className="font-medium text-ink hover:text-primary">
              {cohort.name} intake
            </Link>{" "}
            · {classes.length} {classes.length === 1 ? "class" : "classes"} · {sameDay ? formatDate(first) : `${formatDate(first)} to ${formatDate(last)}`} · {formatTime(first)} Lagos time
          </p>
        </div>
        {missing ? <Pill tone="warning">No Meet link yet</Pill> : <Pill tone="success">Meet link added</Pill>}
      </div>
      <form action={saveMeetLink.bind(null, cohort.id, returnTo)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor={`meet-${cohort.id}`}>
            Google Meet link for every class in this intake
          </label>
          <input
            className="input"
            id={`meet-${cohort.id}`}
            name="meetUrl"
            type="text"
            inputMode="url"
            autoComplete="off"
            defaultValue={cohort.meetUrl}
            placeholder="https://meet.google.com/abc-defg-hij"
          />
        </div>
        <button className="btn-primary btn-sm h-11 shrink-0">{missing ? "Add link" : "Save link"}</button>
      </form>
      <p className="mt-2 text-xs text-muted">
        Students see a Join button on their dashboard shortly before each class, and it opens this link.
        {cohort.meetUrl && (
          <>
            {" "}
            <a href={cohort.meetUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
              Test the link
            </a>
          </>
        )}
        {intake.overrides > 0 && ` ${intake.overrides} ${intake.overrides === 1 ? "class uses" : "classes use"} its own link instead (change it on the class).`}
      </p>
    </section>
  );
}
