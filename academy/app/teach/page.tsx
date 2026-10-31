import type { Metadata } from "next";
import Link from "next/link";
import { BarChart, BarList, KpiCard } from "@/components/charts";
import { Icon, type IconName } from "@/components/icons";
import { Empty, Pill } from "@/components/ui";
import { asset } from "@/lib/assets";
import { getDb } from "@/lib/db";
import { classState, untilText } from "@/lib/learn";
import { naira } from "@/lib/money";
import { teacherDashboard, type Activity } from "@/lib/teacher";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Teacher dashboard" };

/** ₦0, ₦40k, ₦1.2m: short enough for a chart axis. */
function shortNaira(kobo: number) {
  const n = kobo / 100;
  if (n >= 1_000_000) return `₦${+(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `₦${+(n / 1_000).toFixed(1)}k`;
  return `₦${n}`;
}

function ago(date: Date, now = new Date()) {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

const activityIcon: Record<Activity["kind"], { icon: IconName; chip: string }> = {
  payment: { icon: "wallet", chip: "bg-success-soft text-success" },
  submission: { icon: "check", chip: "bg-primary-soft text-primary" },
  certificate: { icon: "cap", chip: "bg-violet-soft text-violet" },
  question: { icon: "sparkles", chip: "bg-warning-soft text-warning" },
};

export default async function TeachHome() {
  const d = await teacherDashboard(await getDb());
  const change = d.incomeLastMonthKobo ? Math.round(((d.incomeThisMonthKobo - d.incomeLastMonthKobo) / d.incomeLastMonthKobo) * 100) : null;
  const todo = [
    d.toMark.length > 0 && { href: "/teach/marking", icon: "check" as const, text: `${d.toMark.length} ${d.toMark.length === 1 ? "piece" : "pieces"} of work to mark` },
    d.missingVideos.length > 0 && {
      href: `/teach/cohorts/${d.missingVideos[0].cohortId}`,
      icon: "video" as const,
      text: `${d.missingVideos.length} video ${d.missingVideos.length === 1 ? "lesson needs its" : "lessons need their"} video link`,
    },
    d.missingRecordings.length > 0 && {
      href: `/teach/cohorts/${d.missingRecordings[0].cohortId}`,
      icon: "video" as const,
      text: `${d.missingRecordings.length} recent live ${d.missingRecordings.length === 1 ? "class has" : "classes have"} no recording`,
    },
    d.noMeetLink.length > 0 && {
      href: `/teach/cohorts/${d.noMeetLink[0].cohortId}`,
      icon: "alert" as const,
      text: `${d.noMeetLink.length} ${d.noMeetLink.length === 1 ? "class" : "classes"} in the next 2 weeks without a Meet link`,
    },
    d.unpaid.length > 0 && { href: "/teach/payments", icon: "wallet" as const, text: `${d.unpaid.length} started enrolling but haven't paid` },
  ].filter((t) => !!t);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">Good to see you, Jules</h1>
          <p className="mt-1 text-muted">Your students, income and teaching at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/teach/courses" className="btn-secondary btn-sm">
            Manage courses
          </Link>
          <Link href="/teach/marking" className="btn-primary btn-sm">
            Mark work
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Income this month"
          icon="wallet"
          tone="green"
          value={naira(d.incomeThisMonthKobo)}
          hint={change === null ? `${naira(d.totalIncomeKobo)} in total` : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% on last month · ${naira(d.totalIncomeKobo)} in total`}
        />
        <KpiCard label="Active students" icon="users" value={d.activeStudents} hint={`${d.newStudents} joined in the last 30 days`} />
        <KpiCard
          label="Waiting for marking"
          icon="check"
          tone="amber"
          value={d.toMark.length}
          hint={d.toMark.length ? `Oldest handed in ${ago(d.toMark.at(-1)!.submittedAt)}` : "All marked"}
        />
        <KpiCard label="Certificates issued" icon="cap" tone="violet" value={d.certificates} hint="Graduates across all courses" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr] [&>*]:min-w-0">
        <section className="card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">Income</h2>
            <span className="text-sm text-muted">Last 6 months</span>
          </div>
          <div className="mt-6">
            <BarChart data={d.incomeByMonth.map((m) => ({ label: m.label, value: m.kobo }))} format={shortNaira} label="Income per month" />
          </div>
        </section>

        <section className="card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">Students by course</h2>
            <span className="text-sm text-muted">Active now</span>
          </div>
          <div className="mt-6">
            {d.byCourse.length === 0 ? (
              <Empty>No courses yet.</Empty>
            ) : (
              <BarList
                data={d.byCourse.map((c) => ({
                  key: c.course.id,
                  label: (
                    <>
                      {c.course.title} <span className="text-muted">· {c.course.format === "recorded" ? "video" : "live"}</span>
                    </>
                  ),
                  value: c.students,
                }))}
              />
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        <section className="card">
          <h2 className="font-display text-lg font-semibold text-ink">Needs your attention</h2>
          {todo.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-success">
              <Icon name="check" className="size-4" /> You&apos;re all caught up.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {todo.map((t) => (
                <li key={t.text}>
                  <Link href={t.href} className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm text-ink transition-colors hover:border-primary">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning">
                      <Icon name={t.icon} className="size-4" />
                    </span>
                    <span className="flex-1">{t.text}</span>
                    <Icon name="arrow" className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-semibold text-ink">Next live classes</h2>
          {d.upcoming.length === 0 ? (
            <div className="mt-4">
              <Empty>No live classes scheduled. Open an intake from Courses & intakes.</Empty>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {d.upcoming.map((c) => {
                const state = classState(c);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link href={`/teach/cohorts/${c.cohortId}/classes/${c.id}`} className="block truncate text-sm font-medium text-ink hover:text-primary">
                        Week {c.week}: {c.title}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {c.course.title} · {state === "upcoming" ? `${formatDateTime(c.startsAt)} (${untilText(c.startsAt)})` : "now"}
                      </p>
                    </div>
                    {state === "open" || state === "live" ? (
                      <a href={asset(`/join/${c.id}`)} className="btn-primary btn-sm shrink-0">
                        Start
                      </a>
                    ) : (
                      <Pill>{c.cohort.name}</Pill>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-semibold text-ink">Recent activity</h2>
          {d.activity.length === 0 ? (
            <div className="mt-4">
              <Empty>Enrolments, handed-in work and certificates will show up here.</Empty>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {d.activity.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${activityIcon[a.kind].chip}`}>
                    <Icon name={activityIcon[a.kind].icon} className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <Link href={a.href} className="line-clamp-2 text-sm text-ink hover:text-primary">
                      {a.text}
                    </Link>
                    <p className="text-xs text-muted">{ago(a.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 overflow-x-auto">
        <h2 className="font-display text-lg font-semibold text-ink">Courses</h2>
        <table className="table mt-3">
          <thead>
            <tr>
              <th>Course</th>
              <th>Format</th>
              <th>Price</th>
              <th>Students</th>
              <th>Income</th>
              <th>Graduates</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {d.byCourse.map(({ course, students, incomeKobo, certificates, selfPacedId }) => (
              <tr key={course.id}>
                <td className="font-medium text-ink">
                  {course.title}
                  {!course.published && (
                    <span className="ms-2">
                      <Pill tone="warning">Draft</Pill>
                    </span>
                  )}
                </td>
                <td>{course.format === "recorded" ? <Pill tone="violet">Video</Pill> : <Pill tone="primary">Live</Pill>}</td>
                <td className="tabular-nums">{naira(course.priceKobo)}</td>
                <td className="tabular-nums">{students}</td>
                <td className="tabular-nums">{naira(incomeKobo)}</td>
                <td className="tabular-nums">{certificates}</td>
                <td className="text-end whitespace-nowrap">
                  <Link href={selfPacedId ? `/teach/cohorts/${selfPacedId}` : `/teach/courses/${course.id}#intakes`} className="text-sm font-medium text-primary hover:underline">
                    {selfPacedId ? "Lessons & students" : "Intakes"}
                  </Link>
                  <span className="mx-2 text-line">|</span>
                  <Link href={`/teach/courses/${course.id}`} className="text-sm font-medium text-primary hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
