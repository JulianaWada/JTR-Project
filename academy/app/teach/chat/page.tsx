import { count, desc, eq, inArray, max } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Empty, PageTitle, Pill } from "@/components/ui";
import { getDb, schema } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Class chats" };

export default async function ClassChats() {
  const db = await getDb();
  const cohorts = await db.query.cohorts.findMany();
  const courses = await db.query.courses.findMany({ orderBy: schema.courses.sortOrder });
  const students = await db
    .select({ cohortId: schema.enrolments.cohortId, value: count() })
    .from(schema.enrolments)
    .where(eq(schema.enrolments.status, "active"))
    .groupBy(schema.enrolments.cohortId);
  const activity = await db
    .select({ cohortId: schema.chatMessages.cohortId, messages: count(), last: max(schema.chatMessages.createdAt) })
    .from(schema.chatMessages)
    .groupBy(schema.chatMessages.cohortId);
  const latest = await db
    .select({ message: schema.chatMessages, name: schema.users.name })
    .from(schema.chatMessages)
    .innerJoin(schema.users, eq(schema.users.id, schema.chatMessages.userId))
    .where(activity.length ? inArray(schema.chatMessages.cohortId, activity.map((a) => a.cohortId)) : undefined)
    .orderBy(desc(schema.chatMessages.createdAt))
    .limit(200);

  // Every intake with students or messages, busiest chats first.
  const rows = cohorts
    .map((cohort) => ({
      cohort,
      course: courses.find((c) => c.id === cohort.courseId),
      students: students.find((s) => s.cohortId === cohort.id)?.value ?? 0,
      activity: activity.find((a) => a.cohortId === cohort.id),
      last: latest.find((l) => l.message.cohortId === cohort.id),
    }))
    .filter((r) => r.students > 0 || r.activity)
    .sort((a, b) => (b.activity?.last?.getTime() ?? 0) - (a.activity?.last?.getTime() ?? 0));

  return (
    <>
      <PageTitle eyebrow="Teacher" title="Class chats">
        Each intake has its own group chat for its paid students and you. Open one to reply, pin a message to the top (house rules, an important link), or
        remove a message.
      </PageTitle>
      {rows.length === 0 ? (
        <Empty>No students yet. A chat opens for each intake once students have paid.</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ cohort, course, students, activity, last }) => (
            <li key={cohort.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">
                  {course?.title} <span className="text-muted">· {cohort.selfPaced ? "video course" : cohort.name}</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {students} {students === 1 ? "student" : "students"} · {activity?.messages ?? 0} {activity?.messages === 1 ? "message" : "messages"}{activity?.last ? ` · last ${formatDateTime(activity.last)}` : ""}
                </p>
                {last && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink">
                    <span className="font-medium">{last.name}:</span> {last.message.body}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!activity && <Pill>Quiet</Pill>}
                <Link href={`/learn/${cohort.id}/chat`} className="btn-primary btn-sm">
                  Open chat
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
