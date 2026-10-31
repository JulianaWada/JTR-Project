import { BadgeIcon } from "@/components/badge-icon";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeGrid } from "@/components/badge-grid";
import { PageTitle, Pill, ProgressBar } from "@/components/ui";
import { asset } from "@/lib/assets";
import { schema } from "@/lib/db";
import { classState, requireCohortAccess, untilText } from "@/lib/learn";
import { getProgress } from "@/lib/progress";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Course" };

export default async function CourseSpace({ params, searchParams }: PageProps<"/learn/[cohortId]">) {
  const { cohortId } = await params;
  const { welcome } = await searchParams;
  const { db, user, cohort, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}`);
  const lessons = await db.query.classes.findMany({ where: eq(schema.classes.cohortId, cohortId), orderBy: asc(schema.classes.startsAt) });
  const attended = new Set(
    lessons.length
      ? (
          await db.query.attendance.findMany({
            where: and(eq(schema.attendance.userId, user.id), inArray(schema.attendance.classId, lessons.map((l) => l.id))),
          })
        ).map((a) => a.classId)
      : [],
  );
  const tasks = await db.query.assignments.findMany({ where: eq(schema.assignments.courseId, course.id), orderBy: asc(schema.assignments.week) });
  const mySubmissions = new Map(
    (await db.query.submissions.findMany({ where: and(eq(schema.submissions.userId, user.id), eq(schema.submissions.cohortId, cohortId)) })).map((s) => [
      s.assignmentId,
      s,
    ]),
  );
  const quizList = await db.query.quizzes.findMany({ where: eq(schema.quizzes.courseId, course.id), orderBy: asc(schema.quizzes.week) });
  const attempts = quizList.length
    ? await db.query.quizAttempts.findMany({
        where: and(eq(schema.quizAttempts.userId, user.id), inArray(schema.quizAttempts.quizId, quizList.map((q) => q.id))),
      })
    : [];
  const bestScore = new Map<string, { score: number; total: number }>();
  for (const a of attempts) {
    const best = bestScore.get(a.quizId);
    if (!best || a.score > best.score) bestScore.set(a.quizId, a);
  }
  const progress = await getProgress(db, user.id, cohortId);
  const badges = await db.query.userBadges.findMany({ where: and(eq(schema.userBadges.userId, user.id), eq(schema.userBadges.cohortId, cohortId)) });
  const selfPaced = cohort.selfPaced;
  const next = selfPaced ? undefined : lessons.find((l) => classState(l) !== "ended");
  const nextState = next ? classState(next) : null;
  const nextToWatch = selfPaced ? lessons.find((l) => !attended.has(l.id)) : undefined;

  return (
    <>
      {welcome && (
        <div className="mb-6 rounded-card border border-success/30 bg-success-soft p-5 text-success">
          <p className="font-semibold">🎉 Welcome to {course.title}!</p>
          <p className="mt-1 text-sm">
            {selfPaced
              ? "Your receipt has been emailed to you. Watch the lessons in order and mark each one done as you go."
              : "Your receipt and timetable have been emailed to you. Join each class from this page so your attendance counts."}
          </p>
        </div>
      )}
      <PageTitle
        eyebrow={selfPaced ? "Video course · learn at your own pace" : `${cohort.name} intake`}
        title={course.title}
        actions={
          <Link href={`/learn/${cohortId}/tutor`} className="btn-primary">
            ✨ Ask the AI tutor
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {next && (
            <section className="card border-primary/40">
              <p className="eyebrow">{nextState === "live" ? "Live now" : `Next class · ${untilText(next.startsAt)}`}</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-ink">
                Week {next.week}: {next.title}
              </h2>
              <p className="mt-1 text-muted">{formatDateTime(next.startsAt)} Lagos time · {next.durationMinutes} minutes on Google Meet</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {nextState === "open" || nextState === "live" ? (
                  <a href={asset(`/join/${next.id}`)} className="btn-primary">
                    Join class now
                  </a>
                ) : (
                  <span className="btn-secondary pointer-events-none opacity-70">Join opens 30 min before</span>
                )}
                <Link href={`/learn/${cohortId}/classes/${next.id}`} className="btn-secondary">
                  Class notes
                </Link>
              </div>
            </section>
          )}

          {nextToWatch && (
            <section className="card border-primary/40">
              <p className="eyebrow">{attended.size ? "Continue where you left off" : "Start here"}</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-ink">
                Lesson {nextToWatch.week}: {nextToWatch.title}
              </h2>
              <p className="mt-1 text-muted">
                {attended.size} of {lessons.length} lessons done
              </p>
              <Link href={`/learn/${cohortId}/classes/${nextToWatch.id}`} className="btn-primary mt-4">
                ▶ Watch the lesson
              </Link>
            </section>
          )}

          <section className="card">
            <h2 className="font-display text-lg font-semibold text-ink">{selfPaced ? "Lessons" : "Timetable"}</h2>
            <ol className="mt-4 divide-y divide-line">
              {lessons.map((l) => {
                const state = classState(l);
                return (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                          attended.has(l.id) ? "bg-success-soft text-success" : "bg-surface-2 text-muted"
                        }`}
                        title={attended.has(l.id) ? (selfPaced ? "Done" : "Attended") : undefined}
                      >
                        {attended.has(l.id) ? "✓" : l.week}
                      </span>
                      <div>
                        <Link href={`/learn/${cohortId}/classes/${l.id}`} className="font-medium text-ink hover:text-primary">
                          {l.title}
                        </Link>
                        <p className="text-xs text-muted">{selfPaced ? `Lesson ${l.week}` : formatDateTime(l.startsAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selfPaced ? (
                        attended.has(l.id) ? (
                          <Pill tone="success">Done</Pill>
                        ) : l.recordingUrl ? (
                          <Pill tone="primary">Video</Pill>
                        ) : (
                          <Pill>Video coming soon</Pill>
                        )
                      ) : state === "ended" ? (
                        <>
                          {attended.has(l.id) ? <Pill tone="success">Attended</Pill> : <Pill>Missed</Pill>}
                          {l.recordingUrl && <Pill tone="primary">Recording</Pill>}
                        </>
                      ) : state === "upcoming" ? (
                        <Pill>Upcoming</Pill>
                      ) : (
                        <Pill tone="warning">Live</Pill>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="card">
            <h2 className="font-display text-lg font-semibold text-ink">Assignments</h2>
            <ul className="mt-4 divide-y divide-line">
              {tasks.map((t) => {
                const s = mySubmissions.get(t.id);
                return (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <Link href={`/learn/${cohortId}/assignments/${t.id}`} className="font-medium text-ink hover:text-primary">
                        {t.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {selfPaced ? "Lesson" : "Week"} {t.week}
                        {t.isFinalProject ? " · Final project" : ""}
                      </p>
                    </div>
                    {s?.grade === "pass" ? (
                      <Pill tone="success">Passed</Pill>
                    ) : s?.grade === "redo" ? (
                      <Pill tone="warning">Please resubmit</Pill>
                    ) : s ? (
                      <Pill tone="primary">Waiting for marking</Pill>
                    ) : (
                      <Pill>Not handed in</Pill>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card">
            <h2 className="font-display text-lg font-semibold text-ink">Quizzes</h2>
            <ul className="mt-4 divide-y divide-line">
              {quizList.map((q) => {
                const best = bestScore.get(q.id);
                return (
                  <li key={q.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <Link href={`/learn/${cohortId}/quizzes/${q.id}`} className="font-medium text-ink hover:text-primary">
                        {q.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {selfPaced ? "Lesson" : "Week"} {q.week} · {q.questions.length} questions
                      </p>
                    </div>
                    {best ? (
                      <Pill tone={best.score === best.total ? "success" : "primary"}>
                        Best {best.score}/{best.total}
                      </Pill>
                    ) : (
                      <Pill>Not taken</Pill>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="font-display text-lg font-semibold text-ink">Your certificate</h2>
            {progress.certificateCode ? (
              <div className="mt-3">
                <p className="flex items-center gap-3 text-sm text-success">
                  <BadgeIcon badge="certificate" className="size-9" /> Congratulations, you&apos;ve completed the course!
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={asset(`/certificates/${progress.certificateCode}/pdf`)} className="btn-primary btn-sm">
                    Download certificate
                  </a>
                  <Link href={`/verify/${progress.certificateCode}`} className="btn-secondary btn-sm">
                    Verification page
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s left to earn it.</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-ink">{selfPaced ? "Lessons watched" : "Attendance"}</span>
                      <span className="text-muted">
                        {progress.attended}/{progress.totalClasses} · need {progress.requiredAttendancePercent}%
                      </span>
                    </div>
                    <ProgressBar
                      value={progress.totalClasses ? (progress.attendancePercent / progress.requiredAttendancePercent) * 100 : 0}
                      tone={progress.attendancePercent >= progress.requiredAttendancePercent ? "success" : "primary"}
                    />
                  </div>
                  {progress.requiresFinalProject && (
                    <p className="flex items-center justify-between text-sm">
                      <span className="text-ink">Final project</span>
                      {progress.finalProjectPassed ? <Pill tone="success">Passed</Pill> : <Pill>Not passed yet</Pill>}
                    </p>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Badges</h2>
              <span className="text-sm text-muted">{badges.length} earned</span>
            </div>
            <div className="mt-4">
              <BadgeGrid earned={badges} compact />
            </div>
          </section>

          <section className="card bg-gradient-to-br from-primary-soft to-surface">
            <h2 className="font-display text-lg font-semibold text-ink">✨ Your AI tutor</h2>
            <p className="mt-1 text-sm text-muted">
              Stuck on an assignment or want an idea explained again? The tutor has read every lesson in this course and answers any time.
            </p>
            <Link href={`/learn/${cohortId}/tutor`} className="btn-primary btn-sm mt-4">
              Ask a question
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
