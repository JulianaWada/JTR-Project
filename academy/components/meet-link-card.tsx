import Link from "next/link";
import { saveMeetLink } from "@/app/teach/actions";
import { Pill } from "@/components/ui";
import { needsLink, usesJtrRoom } from "@/lib/class-room";
import type { liveIntakes } from "@/lib/meet-links";
import { formatDate, formatTime } from "@/lib/time";

type Intake = Awaited<ReturnType<typeof liveIntakes>>[number];

/** One live intake: where its classes happen (the JTR class room, or an outside link Jules pastes). */
export function MeetLinkCard({ intake, returnTo }: { intake: Intake; returnTo: string }) {
  const { cohort, course, classes } = intake;
  const jtr = usesJtrRoom(cohort);
  const missing = needsLink(cohort);
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
        {jtr ? <Pill tone="success">JTR class room</Pill> : missing ? <Pill tone="warning">No link yet</Pill> : <Pill tone="primary">Outside link</Pill>}
      </div>
      <form action={saveMeetLink.bind(null, cohort.id, returnTo)} className="mt-4 space-y-3">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="label">Where do the classes happen?</legend>
          <label className="flex cursor-pointer gap-3 rounded-xl border border-line p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
            <input type="radio" name="room" value="jtr" defaultChecked={jtr} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-ink">JTR class room (recommended)</span>
              <span className="block text-xs text-muted">Video room inside the academy. Only paid students get in. Nothing to set up.</span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-xl border border-line p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
            <input type="radio" name="room" value="link" defaultChecked={!jtr} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-ink">An outside link</span>
              <span className="block text-xs text-muted">Google Meet, Zoom or Teams. Paste the link below.</span>
            </span>
          </label>
        </fieldset>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor={`meet-${cohort.id}`}>
              Outside link <span className="font-normal text-muted">(only used with &quot;An outside link&quot;)</span>
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
          <button className="btn-primary btn-sm h-11 shrink-0">Save</button>
        </div>
      </form>
      <p className="mt-2 text-xs text-muted">
        Students see a Join button on their dashboard from 30 minutes before each class.{" "}
        {jtr ? (
          <Link href={`/learn/${cohort.id}/room`} target="_blank" className="font-medium text-primary hover:underline">
            Open the class room
          </Link>
        ) : (
          cohort.meetUrl && (
            <a href={cohort.meetUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
              Test the link
            </a>
          )
        )}
        {!jtr && intake.overrides > 0 && ` ${intake.overrides} ${intake.overrides === 1 ? "class uses" : "classes use"} its own link instead (change it on the class).`}
      </p>
    </section>
  );
}
