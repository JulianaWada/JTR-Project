import { BadgeIcon } from "@/components/badge-icon";
import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Pill } from "@/components/ui";
import { awardBadges, BADGES } from "@/lib/badges";
import { cn } from "@/lib/cn";
import { schema } from "@/lib/db";
import { requireCohortAccess } from "@/lib/learn";

export const metadata: Metadata = { title: "Quiz" };

async function submitQuiz(cohortId: string, quizId: string, form: FormData) {
  "use server";
  const { db, user, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/quizzes/${quizId}`);
  const quiz = await db.query.quizzes.findFirst({ where: and(eq(schema.quizzes.id, quizId), eq(schema.quizzes.courseId, course.id)) });
  if (!quiz || user.role === "teacher") redirect(`/learn/${cohortId}`);
  const answers = quiz.questions.map((_, i) => {
    const value = Number(form.get(`q${i}`));
    return Number.isInteger(value) ? value : -1;
  });
  const score = quiz.questions.filter((q, i) => q.answer === answers[i]).length;
  const [attempt] = await db
    .insert(schema.quizAttempts)
    .values({ quizId, userId: user.id, answers, score, total: quiz.questions.length })
    .returning();
  const fresh = await awardBadges(db, user.id, cohortId);
  redirect(`/learn/${cohortId}/quizzes/${quizId}?attempt=${attempt.id}${fresh.length ? `&badges=${fresh.join(",")}` : ""}`);
}

export default async function QuizPage({ params, searchParams }: PageProps<"/learn/[cohortId]/quizzes/[quizId]">) {
  const { cohortId, quizId } = await params;
  const { attempt: attemptId, badges } = await searchParams;
  const { db, user, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/quizzes/${quizId}`);
  const quiz = await db.query.quizzes.findFirst({ where: and(eq(schema.quizzes.id, quizId), eq(schema.quizzes.courseId, course.id)) });
  if (!quiz) notFound();
  const attempt =
    typeof attemptId === "string"
      ? await db.query.quizAttempts.findFirst({
          where: and(eq(schema.quizAttempts.id, attemptId), eq(schema.quizAttempts.userId, user.id), eq(schema.quizAttempts.quizId, quizId)),
        })
      : undefined;
  const previous = await db.query.quizAttempts.findFirst({
    where: and(eq(schema.quizAttempts.userId, user.id), eq(schema.quizAttempts.quizId, quizId)),
    orderBy: desc(schema.quizAttempts.score),
  });
  const newBadges = typeof badges === "string" ? badges.split(",").filter((b): b is keyof typeof BADGES => b in BADGES) : [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/learn/${cohortId}`} className="text-sm text-muted hover:text-primary">
        ← {course.title}
      </Link>
      <p className="eyebrow mt-4">Week {quiz.week} quiz</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{quiz.title}</h1>
      {previous && !attempt && (
        <p className="mt-2 text-sm text-muted">
          Your best score so far: {previous.score}/{previous.total}. You can take it again as often as you like.
        </p>
      )}

      {attempt ? (
        <>
          <div className={cn("card mt-6 text-center", attempt.score === attempt.total && "border-success/40 bg-success-soft")}>
            <p className="text-4xl" aria-hidden>
              {attempt.score === attempt.total ? "🎯" : attempt.score * 2 >= attempt.total ? "👍" : "📚"}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {attempt.score} / {attempt.total}
            </p>
            <p className="mt-1 text-muted">
              {attempt.score === attempt.total ? "Perfect score!" : "Check the answers below, then try again when you're ready."}
            </p>
            {newBadges.map((b) => (
              <p key={b} className="mt-3 flex items-center gap-2 text-sm font-medium text-success">
                <BadgeIcon badge={b} className="size-7" /> New badge: {BADGES[b].name}
              </p>
            ))}
          </div>
          <ol className="mt-6 space-y-4">
            {quiz.questions.map((q, i) => (
              <li key={i} className="card">
                <p className="font-medium text-ink">
                  {i + 1}. {q.question}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {q.options.map((o, j) => (
                    <li
                      key={j}
                      className={cn(
                        "rounded-lg border px-3 py-2",
                        j === q.answer ? "border-success/40 bg-success-soft text-success" : j === attempt.answers[i] ? "border-danger/40 bg-danger/10 text-danger" : "border-line text-muted",
                      )}
                    >
                      {o}
                      {j === q.answer ? " ✓" : j === attempt.answers[i] ? " (your answer)" : ""}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex gap-2">
            <Link href={`/learn/${cohortId}/quizzes/${quizId}`} className="btn-secondary">
              Try again
            </Link>
            <Link href={`/learn/${cohortId}`} className="btn-primary">
              Back to the course
            </Link>
          </div>
        </>
      ) : (
        <form action={submitQuiz.bind(null, cohortId, quizId)} className="mt-6 space-y-4">
          {quiz.questions.map((q, i) => (
            <fieldset key={i} className="card">
              <legend className="sr-only">Question {i + 1}</legend>
              <p className="font-medium text-ink">
                {i + 1}. {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((o, j) => (
                  <label key={j} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2 text-sm text-ink has-checked:border-primary has-checked:bg-primary-soft">
                    <input type="radio" name={`q${i}`} value={j} required className="accent-[var(--primary)]" />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {user.role === "teacher" ? <Pill>Teachers can preview but not submit</Pill> : <button className="btn-primary">Check my answers</button>}
        </form>
      )}
    </div>
  );
}
