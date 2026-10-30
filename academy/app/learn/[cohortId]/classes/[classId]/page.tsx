import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill } from "@/components/ui";
import { asset } from "@/lib/assets";
import { schema } from "@/lib/db";
import { classState, requireCohortAccess, untilText } from "@/lib/learn";
import { Markdown } from "@/lib/markdown";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Class" };

export default async function ClassPage({ params }: PageProps<"/learn/[cohortId]/classes/[classId]">) {
  const { cohortId, classId } = await params;
  const { db, user, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/classes/${classId}`);
  const lesson = await db.query.classes.findFirst({ where: and(eq(schema.classes.id, classId), eq(schema.classes.cohortId, cohortId)) });
  if (!lesson) notFound();
  const attended = await db.query.attendance.findFirst({ where: and(eq(schema.attendance.classId, classId), eq(schema.attendance.userId, user.id)) });
  const quiz = await db.query.quizzes.findFirst({ where: and(eq(schema.quizzes.courseId, course.id), eq(schema.quizzes.week, lesson.week)) });
  const task = await db.query.assignments.findFirst({ where: and(eq(schema.assignments.courseId, course.id), eq(schema.assignments.week, lesson.week)) });
  const state = classState(lesson);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <article>
        <Link href={`/learn/${cohortId}`} className="text-sm text-muted hover:text-primary">
          ← {course.title}
        </Link>
        <p className="eyebrow mt-4">Week {lesson.week}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{lesson.title}</h1>
        <p className="mt-2 text-muted">{formatDateTime(lesson.startsAt)} Lagos time · {lesson.durationMinutes} minutes</p>
        <div className="card mt-6">
          {lesson.notes.trim() ? <Markdown source={lesson.notes} /> : <p className="text-muted">Jules will add the notes for this class soon.</p>}
        </div>
      </article>

      <aside className="space-y-4 lg:pt-16">
        <section className="card">
          <h2 className="font-semibold text-ink">Live class</h2>
          {state === "ended" ? (
            <p className="mt-2 text-sm text-muted">
              This class has ended.{" "}
              {attended ? <Pill tone="success">You attended</Pill> : <Pill>You missed this one</Pill>}
            </p>
          ) : state === "upcoming" ? (
            <p className="mt-2 text-sm text-muted">Starts {untilText(lesson.startsAt)}. The Join button opens 30 minutes before.</p>
          ) : (
            <a href={asset(`/join/${lesson.id}`)} className="btn-primary mt-3 w-full">
              Join class now
            </a>
          )}
          {lesson.recordingUrl && (
            <a href={lesson.recordingUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-3 w-full">
              ▶ Watch the recording
            </a>
          )}
        </section>
        {lesson.resources.length > 0 && (
          <section className="card">
            <h2 className="font-semibold text-ink">Links and files</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {lesson.resources.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {r.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        {(quiz || task) && (
          <section className="card">
            <h2 className="font-semibold text-ink">This week</h2>
            <div className="mt-3 flex flex-col gap-2">
              {quiz && (
                <Link href={`/learn/${cohortId}/quizzes/${quiz.id}`} className="btn-secondary">
                  Take the quiz: {quiz.title}
                </Link>
              )}
              {task && (
                <Link href={`/learn/${cohortId}/assignments/${task.id}`} className="btn-secondary">
                  Assignment: {task.title}
                </Link>
              )}
            </div>
          </section>
        )}
        <section className="card">
          <h2 className="font-semibold text-ink">Questions about this class?</h2>
          <Link href={`/learn/${cohortId}/tutor?q=${encodeURIComponent(`Can you explain the main idea of week ${lesson.week}, "${lesson.title}", with an example?`)}`} className="btn-primary btn-sm mt-3">
            ✨ Ask the AI tutor
          </Link>
        </section>
      </aside>
    </div>
  );
}
