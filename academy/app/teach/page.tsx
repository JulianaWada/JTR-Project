import type { Metadata } from "next";
import Link from "next/link";
import { Empty, PageTitle, Stat } from "@/components/ui";
import { getDb } from "@/lib/db";
import { naira } from "@/lib/money";
import { classState, untilText } from "@/lib/learn";
import { courseWithCohorts, teacherOverview } from "@/lib/teacher";
import { formatDate, formatDateTime } from "@/lib/time";
import { asset } from "@/lib/assets";

export const metadata: Metadata = { title: "Teacher dashboard" };

export default async function TeachHome() {
  const db = await getDb();
  const o = await teacherOverview(db);
  const courses = await courseWithCohorts(db);

  return (
    <>
      <PageTitle eyebrow="Teacher dashboard" title="Good to see you, Jules">
        Your classes, students and income at a glance.
      </PageTitle>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active students" value={o.activeStudents} hint={`${o.activeEnrolments} course enrolments`} />
        <Stat label="Income this month" value={naira(o.monthIncomeKobo)} hint={`${naira(o.totalIncomeKobo)} in total`} />
        <Stat label="Waiting for marking" value={o.toMark} hint={<Link href="/teach/marking" className="text-primary hover:underline">Open marking</Link>} />
        <Stat label="Courses" value={courses.filter((c) => c.course.published).length} hint={`${courses.reduce((s, c) => s + c.cohorts.length, 0)} intakes`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card">
          <h2 className="font-display text-lg font-semibold text-ink">Next live classes</h2>
          {o.upcoming.length === 0 ? (
            <div className="mt-4">
              <Empty>No classes scheduled. Create an intake from Courses & intakes.</Empty>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {o.upcoming.map((c) => {
                const state = classState(c);
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-ink">
                        {c.course.title} · Week {c.week}: {c.title}
                      </p>
                      <p className="text-sm text-muted">
                        {c.cohort.name} · {formatDateTime(c.startsAt)} {state === "upcoming" ? `(${untilText(c.startsAt)})` : state === "ended" ? "(ended)" : "(now)"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(state === "open" || state === "live") && (
                        <a href={asset(`/join/${c.id}`)} className="btn-primary btn-sm">
                          Start class
                        </a>
                      )}
                      <Link href={`/teach/cohorts/${c.cohortId}/classes/${c.id}`} className="btn-secondary btn-sm">
                        Notes & recording
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-semibold text-ink">Intakes</h2>
          <ul className="mt-4 space-y-3">
            {courses.flatMap(({ course, cohorts }) =>
              cohorts.map((c) => (
                <li key={c.id}>
                  <Link href={`/teach/cohorts/${c.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 hover:border-primary">
                    <div>
                      <p className="text-sm font-medium text-ink">{course.title}</p>
                      <p className="text-xs text-muted">
                        {c.name} · starts {formatDate(c.startsAt)}
                      </p>
                    </div>
                    <span className="text-sm text-muted">
                      {c.students}/{c.capacity}
                    </span>
                  </Link>
                </li>
              )),
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
