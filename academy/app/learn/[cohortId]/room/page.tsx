import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pill } from "@/components/ui";
import { checkCompletion } from "@/lib/certificates";
import { openClass, outsideLink, roomPass, usesJtrRoom } from "@/lib/class-room";
import { schema } from "@/lib/db";
import { requireCohortAccess, untilText } from "@/lib/learn";
import { lessonLabel } from "@/lib/lesson-unit";
import { addMinutes, formatDateTime, formatTime } from "@/lib/time";

export const metadata: Metadata = { title: "Class room" };
export const dynamic = "force-dynamic";

/** The JTR class room: the intake's private video room, inside the academy. Paid students during class time, Jules any time. */
export default async function ClassRoom({ params }: PageProps<"/learn/[cohortId]/room">) {
  const { cohortId } = await params;
  const { db, user, cohort, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/room`);
  if (cohort.selfPaced) redirect(`/learn/${cohortId}`);
  if (!usesJtrRoom(cohort)) redirect(outsideLink(cohort) || `/learn/${cohortId}`);
  const teacher = user.role === "teacher";
  const lessons = await db.query.classes.findMany({ where: eq(schema.classes.cohortId, cohortId), orderBy: asc(schema.classes.startsAt) });
  const now = new Date();
  const current = openClass(lessons, now);
  const next = lessons.find((l) => l.startsAt > now);

  if (!current && !teacher) {
    return (
      <div className="mx-auto max-w-xl">
        <Link href={`/learn/${cohortId}`} className="text-sm text-muted hover:text-primary">
          ← {course.title}
        </Link>
        <section className="card mt-4 text-center">
          <p className="eyebrow">JTR class room</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">No class right now</h1>
          <p className="mt-2 text-muted">
            {next
              ? `The next class, ${lessonLabel(course, false).toLowerCase()} ${next.week} "${next.title}", is ${formatDateTime(next.startsAt)} Lagos time (${untilText(next.startsAt, now)}). The room opens 30 minutes before.`
              : "All the classes in this intake have finished. Recordings are on each class page."}
          </p>
          <Link href={`/learn/${cohortId}`} className="btn-primary mt-4">
            Back to the course
          </Link>
        </section>
      </div>
    );
  }

  if (current && !teacher) {
    await db.insert(schema.attendance).values({ classId: current.id, userId: user.id, source: "join" }).onConflictDoNothing();
    await checkCompletion(db, user.id, cohortId);
  }
  const until = current ? addMinutes(current.startsAt, current.durationMinutes) : addMinutes(now, 4 * 60);
  const pass = await roomPass({ cohortId, user, host: teacher, until });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/learn/${cohortId}`} className="text-sm text-muted hover:text-primary">
            ← {course.title}
          </Link>
          <p className="eyebrow mt-3">JTR class room · {cohort.name} intake</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
            {current ? `${lessonLabel(course, false)} ${current.week}: ${current.title}` : "Your class room"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {current
              ? `${formatTime(current.startsAt)} to ${formatTime(addMinutes(current.startsAt, current.durationMinutes))} Lagos time`
              : next
                ? `No class on now. Next: ${formatDateTime(next.startsAt)} Lagos time. You can come in early to test your camera and microphone.`
                : "No class on now."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {teacher ? <Pill tone="primary">You are the host</Pill> : <Pill tone="success">✓ Attendance recorded</Pill>}
          {pass.mode === "live" && (
            <a href={pass.url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
              Open in a new tab
            </a>
          )}
        </div>
      </div>

      {pass.mode === "live" ? (
        <div className="h-[calc(100dvh-14rem)] min-h-[28rem] overflow-hidden rounded-card border border-line bg-black">
          <iframe
            src={pass.url}
            title="JTR class room"
            className="size-full"
            allow="camera; microphone; fullscreen; speaker; display-capture; autoplay; clipboard-write"
            allowFullScreen
          />
        </div>
      ) : (
        <TestRoom names={[user.name, teacher ? "Amaka Obi" : "Jules", "Tunde A."]} error={pass.mode === "error" ? pass.message : null} />
      )}
      <p className="mt-3 text-xs text-muted">
        Allow your browser to use your camera and microphone when it asks. The room is private to this intake: only students who paid, and Jules, can come
        in.
      </p>
    </div>
  );
}

/** What the room looks like before video is switched on (no DAILY_API_KEY), or if it couldn't open. */
function TestRoom({ names, error }: { names: string[]; error: string | null }) {
  return (
    <div className="relative grid h-[calc(100dvh-14rem)] min-h-[28rem] grid-rows-[1fr_auto] overflow-hidden rounded-card border border-line bg-[#0b1630] text-white">
      <div className="grid grid-cols-2 gap-3 p-3 lg:grid-cols-3">
        {names.map((n, i) => (
          <div key={n} className={`grid place-items-center rounded-xl bg-white/5 ${i === 0 ? "col-span-2 ring-2 ring-[#2f7bff] lg:col-span-1" : ""}`}>
            <div className="text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#2f7bff] text-base sm:size-16 sm:text-xl font-semibold">
                {n
                  .split(/\s+/)
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <p className="mt-2 text-sm text-white/80">{i === 0 ? `${n} (you)` : n}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm">
        <p className="text-white/70">{error ?? "Test mode: live video starts once the Daily key (DAILY_API_KEY) is added. This is a preview of the room."}</p>
        <div className="flex flex-wrap gap-2" aria-hidden>
          {["Mic", "Camera", "Share screen", "Chat"].map((b) => (
            <span key={b} className="rounded-full bg-white/10 px-3 py-1.5 text-xs">
              {b}
            </span>
          ))}
          <span className="rounded-full bg-red-600 px-3 py-1.5 text-xs">Leave</span>
        </div>
      </div>
    </div>
  );
}
