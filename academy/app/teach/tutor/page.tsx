import { desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { Empty, PageTitle } from "@/components/ui";
import { getDb, schema } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Tutor questions" };

export default async function TutorQuestions() {
  const db = await getDb();
  const questions = await db.query.tutorMessages.findMany({
    where: eq(schema.tutorMessages.role, "user"),
    orderBy: desc(schema.tutorMessages.createdAt),
    limit: 100,
  });
  const users = questions.length ? await db.query.users.findMany({ where: inArray(schema.users.id, [...new Set(questions.map((q) => q.userId))]) }) : [];
  const cohorts = await db.query.cohorts.findMany();
  const courses = await db.query.courses.findMany();

  return (
    <>
      <PageTitle eyebrow="Teacher" title="What students ask the AI tutor">
        The latest questions, so you can spot topics to cover again in class.
      </PageTitle>
      {questions.length === 0 ? (
        <Empty>No questions yet.</Empty>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => {
            const cohort = cohorts.find((c) => c.id === q.cohortId);
            return (
              <li key={q.id} className="card">
                <p className="text-ink">“{q.content}”</p>
                <p className="mt-2 text-xs text-muted">
                  {users.find((u) => u.id === q.userId)?.name} · {courses.find((c) => c.id === cohort?.courseId)?.title}, {cohort?.name} ·{" "}
                  {formatDateTime(q.createdAt)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
