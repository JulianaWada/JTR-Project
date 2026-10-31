import { desc, inArray, isNotNull, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import { Empty, Flash, PageTitle, Pill } from "@/components/ui";
import { getDb, schema } from "@/lib/db";
import { formatDateTime } from "@/lib/time";
import { markSubmission } from "../actions";

export const metadata: Metadata = { title: "Marking" };

async function withDetails(rows: (typeof schema.submissions.$inferSelect)[]) {
  const db = await getDb();
  if (!rows.length) return [];
  const users = await db.query.users.findMany({ where: inArray(schema.users.id, [...new Set(rows.map((r) => r.userId))]) });
  const tasks = await db.query.assignments.findMany({ where: inArray(schema.assignments.id, [...new Set(rows.map((r) => r.assignmentId))]) });
  const cohorts = await db.query.cohorts.findMany({ where: inArray(schema.cohorts.id, [...new Set(rows.map((r) => r.cohortId))]) });
  const courses = await db.query.courses.findMany();
  return rows.map((s) => {
    const cohort = cohorts.find((c) => c.id === s.cohortId)!;
    return {
      ...s,
      student: users.find((u) => u.id === s.userId)!,
      task: tasks.find((t) => t.id === s.assignmentId)!,
      cohort,
      course: courses.find((c) => c.id === cohort.courseId)!,
    };
  });
}

export default async function Marking({ searchParams }: PageProps<"/teach/marking">) {
  const db = await getDb();
  const waiting = await withDetails(await db.query.submissions.findMany({ where: isNull(schema.submissions.grade), orderBy: schema.submissions.submittedAt }));
  const recent = await withDetails(
    await db.query.submissions.findMany({ where: isNotNull(schema.submissions.grade), orderBy: desc(schema.submissions.markedAt), limit: 15 }),
  );

  return (
    <>
      <PageTitle eyebrow="Teacher" title="Marking">
        Pass the work or ask for another try, with feedback. Students get an email either way, and passing a final project can complete their certificate.
      </PageTitle>
      <Flash searchParams={searchParams} />
      {waiting.length === 0 ? (
        <Empty>Nothing waiting. Nice work!</Empty>
      ) : (
        <div className="space-y-4">
          {waiting.map((s) => (
            <article key={s.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{s.task.title}</p>
                  <p className="text-sm text-muted">
                    {s.student.name} · {s.course.title}, {s.cohort.name} · handed in {formatDateTime(s.submittedAt)}
                  </p>
                </div>
                {s.task.isFinalProject && <Pill tone="violet">Final project</Pill>}
              </div>
              {s.link && (
                <a href={s.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                  Open their work ↗
                </a>
              )}
              {s.text && <p className="mt-3 rounded-xl bg-surface-2 p-4 text-sm whitespace-pre-wrap text-ink">{s.text}</p>}
              <form action={markSubmission.bind(null, s.id)} className="mt-4 space-y-3">
                <textarea className="input min-h-20" name="feedback" placeholder="Feedback for the student (optional)" />
                <div className="flex gap-2">
                  <button name="grade" value="pass" className="btn-primary btn-sm">
                    ✓ Pass
                  </button>
                  <button name="grade" value="redo" className="btn-secondary btn-sm">
                    Ask to resubmit
                  </button>
                </div>
              </form>
            </article>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <section className="card mt-8">
          <h2 className="font-display text-lg font-semibold text-ink">Recently marked</h2>
          <table className="table mt-3">
            <thead>
              <tr>
                <th>Student</th>
                <th>Assignment</th>
                <th>Result</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-ink">{s.student.name}</td>
                  <td className="text-muted">{s.task.title}</td>
                  <td>{s.grade === "pass" ? <Pill tone="success">Passed</Pill> : <Pill tone="warning">Resubmit</Pill>}</td>
                  <td className="text-muted">{s.feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
