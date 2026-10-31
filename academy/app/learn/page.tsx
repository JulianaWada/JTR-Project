import { BadgeIcon } from "@/components/badge-icon";
import type { Metadata } from "next";
import Link from "next/link";
import { KpiCard } from "@/components/charts";
import { CourseArt } from "@/components/course-art";
import { Empty, PageTitle, Pill, ProgressBar } from "@/components/ui";
import { asset } from "@/lib/assets";
import { requireUser } from "@/lib/auth";
import { BADGES, type BadgeKey } from "@/lib/badges";
import { getDb } from "@/lib/db";
import { classState, untilText } from "@/lib/learn";
import { badgesFor, studentOverview } from "@/lib/student";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "My learning" };

export default async function LearnHome() {
  const user = await requireUser("/learn");
  const db = await getDb();
  const courses = await studentOverview(db, user.id);
  const badges = await badgesFor(db, user.id);
  const firstName = user.name.split(" ")[0];
  const active = courses.filter((c) => c.progress);
  const done = active.reduce((n, c) => n + c.progress!.attended, 0);
  const total = active.reduce((n, c) => n + c.progress!.totalClasses, 0);
  const certificates = active.filter((c) => c.progress!.certificateCode).length;

  return (
    <>
      <PageTitle eyebrow="My learning" title={`Welcome back, ${firstName}`}>
        Your courses, next classes and progress in one place.
      </PageTitle>

      {courses.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="My courses" icon="book" value={courses.length} hint={`${active.length} unlocked`} />
          <KpiCard label="Lessons done" icon="check" tone="green" value={done} hint={`of ${total} so far`} />
          <KpiCard label="Badges earned" icon="award" tone="amber" value={badges.length} hint={<Link href="/learn/badges" className="text-primary hover:underline">See all badges</Link>} />
          <KpiCard label="Certificates" icon="cap" tone="violet" value={certificates} hint={certificates ? "Well done!" : "Finish a course to earn one"} />
        </div>
      )}

      {courses.length === 0 ? (
        <Empty>
          You haven&apos;t joined a course yet.{" "}
          <Link href="/#courses" className="font-medium text-primary hover:underline">
            Browse the courses
          </Link>
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {courses.map(({ enrolment, cohort, course, nextClass, pendingPayment, progress }) => {
            const state = nextClass ? classState(nextClass) : null;
            return (
              <article key={enrolment.id} className="overflow-hidden rounded-card border border-line bg-surface shadow-[var(--card-shadow)]">
                <CourseArt slug={course.slug} accent={course.accent} className="h-28" />
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={course.accent === "violet" ? "violet" : "primary"}>{cohort.selfPaced ? "Video course" : `${cohort.name} intake`}</Pill>
                    {progress?.certificateCode && <Pill tone="success">Completed</Pill>}
                    {enrolment.status === "pending" && <Pill tone="warning">Payment not finished</Pill>}
                  </div>
                  <h2 className="mt-3 font-display text-xl font-semibold text-ink">{course.title}</h2>

                  {enrolment.status === "pending" ? (
                    <div className="mt-4">
                      <p className="text-sm text-muted">Finish paying to unlock your {cohort.selfPaced ? "lessons" : "classes"}, notes and AI tutor.</p>
                      <Link
                        href={pendingPayment?.provider === "test" ? `/pay/test/${pendingPayment.reference}` : `/enrol/${cohort.id}`}
                        className="btn-primary mt-4"
                      >
                        Complete payment
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-xs text-muted">
                          <span>Progress</span>
                          <span>{progress!.overallPercent}%</span>
                        </div>
                        <ProgressBar value={progress!.overallPercent} tone={progress!.certificateCode ? "success" : "primary"} />
                        <p className="mt-2 text-xs text-muted">
                          {progress!.attended} of {progress!.totalClasses} {cohort.selfPaced ? "lessons watched" : "classes attended"} · {progress!.passed} of {progress!.totalAssignments} assignments passed
                        </p>
                      </div>
                      {nextClass && !cohort.selfPaced && state !== "ended" ? (
                        <div className="mt-5 rounded-xl bg-surface-2 p-4">
                          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                            {state === "live" ? "Live now" : `Next class ${untilText(nextClass.startsAt)}`}
                          </p>
                          <p className="mt-1 font-medium text-ink">
                            Week {nextClass.week}: {nextClass.title}
                          </p>
                          <p className="text-sm text-muted">{formatDateTime(nextClass.startsAt)} (Lagos time)</p>
                          {(state === "open" || state === "live") && (
                            <a href={asset(`/join/${nextClass.id}`)} className="btn-primary btn-sm mt-3">
                              Join class now
                            </a>
                          )}
                        </div>
                      ) : null}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link href={`/learn/${cohort.id}`} className="btn-primary">
                          Open course
                        </Link>
                        <Link href={`/learn/${cohort.id}/tutor`} className="btn-secondary">
                          Ask the AI tutor
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {badges.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Your badges</h2>
            <Link href="/learn/badges" className="text-sm font-medium text-primary hover:underline">
              See all
            </Link>
          </div>
          <ul className="mt-4 flex flex-wrap gap-3">
            {badges.map((b) => {
              const badge = BADGES[b.badge as BadgeKey];
              if (!badge) return null;
              return (
                <li key={`${b.cohortId}-${b.badge}`} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 ps-2 pe-4 text-sm">
                  <BadgeIcon badge={b.badge as BadgeKey} className="size-7" />
                  <span className="font-medium text-ink">{badge.name}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
