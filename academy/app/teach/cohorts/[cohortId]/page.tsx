import { and, asc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, PageTitle, Pill } from "@/components/ui";
import { asset } from "@/lib/assets";
import { getDb, schema } from "@/lib/db";
import { naira } from "@/lib/money";
import { getProgress } from "@/lib/progress";
import { formatDate, formatDateTime } from "@/lib/time";
import { issueCertificateAction, revokeCertificateAction, saveAttendance, sendAnnouncement, updateCohort } from "../../actions";

export const metadata: Metadata = { title: "Intake" };

export default async function CohortPage({ params, searchParams }: PageProps<"/teach/cohorts/[cohortId]">) {
  const { cohortId } = await params;
  const db = await getDb();
  const cohort = await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, cohortId) });
  if (!cohort) notFound();
  const course = (await db.query.courses.findFirst({ where: eq(schema.courses.id, cohort.courseId) }))!;
  const lessons = await db.query.classes.findMany({ where: eq(schema.classes.cohortId, cohortId), orderBy: asc(schema.classes.startsAt) });
  const enrolled = await db.query.enrolments.findMany({ where: eq(schema.enrolments.cohortId, cohortId) });
  const active = enrolled.filter((e) => e.status === "active");
  const people = enrolled.length
    ? await db.query.users.findMany({
        where: inArray(
          schema.users.id,
          enrolled.map((e) => e.userId),
        ),
      })
    : [];
  const present = new Set(
    lessons.length
      ? (
          await db.query.attendance.findMany({
            where: inArray(
              schema.attendance.classId,
              lessons.map((l) => l.id),
            ),
          })
        ).map((a) => `${a.userId}:${a.classId}`)
      : [],
  );
  const students = await Promise.all(
    active.map(async (e) => {
      const user = people.find((p) => p.id === e.userId)!;
      const progress = await getProgress(db, user.id, cohortId);
      const paid = await db.query.payments.findFirst({
        where: and(eq(schema.payments.enrolmentId, e.id), eq(schema.payments.status, "success")),
      });
      return { user, progress, paid };
    }),
  );
  const pending = enrolled.filter((e) => e.status === "pending").map((e) => people.find((p) => p.id === e.userId)!);
  const now = new Date();
  const selfPaced = cohort.selfPaced;

  return (
    <>
      <Link href={`/teach/courses/${course.id}`} className="text-sm text-muted hover:text-primary">
        ← {course.title}
      </Link>
      <PageTitle title={selfPaced ? `${course.title}: video lessons` : `${course.title}: ${cohort.name}`}>
        {selfPaced
          ? `Self-paced · ${active.length} students · ${cohort.enrolmentOpen ? "enrolment open" : "enrolment closed"}`
          : `Starts ${formatDate(cohort.startsAt)} · ${active.length}/${cohort.capacity} students · ${cohort.enrolmentOpen ? "enrolment open" : "enrolment closed"}`}
      </PageTitle>
      <Flash searchParams={searchParams} />

      <section className="card">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">{selfPaced ? "Video lessons" : "Classes"}</h2>
          <Link href={`/teach/cohorts/${cohortId}/classes/new`} className="btn-secondary btn-sm">
            {selfPaced ? "+ Add a lesson" : "+ Add a class"}
          </Link>
        </div>
        <table className="table mt-3">
          <thead>
            <tr>
              <th>{selfPaced ? "Lesson" : "Week"}</th>
              <th>{selfPaced ? "Title" : "Class"}</th>
              {!selfPaced && <th>When (Lagos)</th>}
              <th>{selfPaced ? "Watched" : "Attended"}</th>
              <th>{selfPaced ? "Video" : "Recording"}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id}>
                <td>{l.week}</td>
                <td className="font-medium text-ink">{l.title}</td>
                {!selfPaced && <td className="text-muted">{formatDateTime(l.startsAt)}</td>}
                <td>{selfPaced || l.startsAt < now ? `${active.filter((e) => present.has(`${e.userId}:${l.id}`)).length}/${active.length}` : "–"}</td>
                <td>{l.recordingUrl ? <Pill tone="success">Added</Pill> : selfPaced || l.startsAt < now ? <Pill tone="warning">Missing</Pill> : "–"}</td>
                <td className="text-end">
                  <Link href={`/teach/cohorts/${cohortId}/classes/${l.id}`} className="text-sm font-medium text-primary hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="students" className="card mt-6 scroll-mt-24">
        <h2 className="font-display text-lg font-semibold text-ink">{selfPaced ? "Students and progress" : "Students and attendance"}</h2>
        <p className="mt-1 text-sm text-muted">
          {selfPaced
            ? "A lesson is ticked when the student marks it done. Tick or untick boxes to correct it, then save."
            : "Attendance is recorded when students join from their dashboard. Tick or untick boxes to correct it, then save."}{" "}
          Certificates issue automatically once a student reaches {course.completionAttendancePercent}% {selfPaced ? "of lessons watched" : "attendance"}
          {course.requiresFinalProject ? " and passes the final project" : ""}.
        </p>
        {students.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No students yet.</p>
        ) : (
          <form action={saveAttendance.bind(null, cohortId)} className="mt-4 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  {lessons.map((l) => (
                    <th key={l.id} className="text-center" title={l.title}>
                      W{l.week}
                    </th>
                  ))}
                  <th>Progress</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {students.map(({ user, progress, paid }) => (
                  <tr key={user.id}>
                    <td>
                      <p className="font-medium text-ink">{user.name}</p>
                      <p className="text-xs text-muted">
                        {user.email}
                        {user.phone ? ` · ${user.phone}` : ""}
                      </p>
                      <p className="text-xs text-muted">{paid ? `Paid ${naira(paid.amountKobo)}` : "Added without payment"}</p>
                    </td>
                    {lessons.map((l) => (
                      <td key={l.id} className="text-center">
                        <input
                          type="checkbox"
                          name="present"
                          value={`${user.id}:${l.id}`}
                          defaultChecked={present.has(`${user.id}:${l.id}`)}
                          aria-label={`${user.name} attended week ${l.week}`}
                          className="size-4 accent-[var(--primary)]"
                        />
                      </td>
                    ))}
                    <td className="text-xs whitespace-nowrap text-muted">
                      {progress.attendancePercent}% {selfPaced ? "watched" : "attendance"}
                      <br />
                      {progress.passed}/{progress.totalAssignments} passed
                    </td>
                    <td>
                      {progress.certificateCode ? (
                        <div className="space-y-1">
                          <a href={asset(`/certificates/${progress.certificateCode}/pdf`)} className="text-sm font-medium text-success hover:underline">
                            {progress.certificateCode}
                          </a>
                          <button
                            formAction={revokeCertificateAction.bind(null, cohortId, progress.certificateCode)}
                            className="block text-xs text-danger hover:underline"
                          >
                            Withdraw
                          </button>
                        </div>
                      ) : (
                        <button formAction={issueCertificateAction.bind(null, cohortId, user.id)} className="text-xs font-medium text-primary hover:underline">
                          Issue anyway
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn-primary btn-sm mt-4">{selfPaced ? "Save progress" : "Save attendance"}</button>
          </form>
        )}
        {pending.length > 0 && (
          <p className="mt-4 text-sm text-muted">Started enrolling but not paid yet: {pending.map((p) => `${p.name} (${p.email})`).join(", ")}.</p>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section id="announce" className="card scroll-mt-24">
          <h2 className="font-display text-lg font-semibold text-ink">{selfPaced ? "Email all students on this course" : "Email everyone in this intake"}</h2>
          <form action={sendAnnouncement.bind(null, cohortId)} className="mt-4 space-y-3">
            <input className="input" name="subject" placeholder="Subject, e.g. Tonight's class starts 30 min later" required />
            <textarea className="input min-h-32" name="body" placeholder="Your message" required />
            <button className="btn-primary btn-sm">Send to {active.length} students</button>
          </form>
        </section>
        <section className="card">
          <h2 className="font-display text-lg font-semibold text-ink">{selfPaced ? "Enrolment" : "Intake settings"}</h2>
          <form action={updateCohort.bind(null, cohortId)} className="mt-4 space-y-3">
            {selfPaced ? (
              <>
                <input type="hidden" name="name" value={cohort.name} />
                <input type="hidden" name="capacity" value={cohort.capacity} />
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="name">
                      Name
                    </label>
                    <input className="input" id="name" name="name" defaultValue={cohort.name} required />
                  </div>
                  <div>
                    <label className="label" htmlFor="capacity">
                      Seats
                    </label>
                    <input className="input" id="capacity" name="capacity" type="number" min={1} defaultValue={cohort.capacity} />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="meetUrl">
                    Google Meet link for all classes
                  </label>
                  <input className="input" id="meetUrl" name="meetUrl" type="url" defaultValue={cohort.meetUrl} placeholder="https://meet.google.com/…" />
                </div>
              </>
            )}
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="enrolmentOpen" defaultChecked={cohort.enrolmentOpen} /> Enrolment open
            </label>
            <button className="btn-primary btn-sm">Save settings</button>
          </form>
        </section>
      </div>
    </>
  );
}
