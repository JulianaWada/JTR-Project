import { asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, PageTitle, Pill } from "@/components/ui";
import { getDb, schema } from "@/lib/db";
import { quizToText } from "@/lib/quiz-format";
import { formatDate, toLagosParts } from "@/lib/time";
import { addDays } from "@/lib/time";
import { createCohort, deleteAssignment, deleteQuiz, saveAssignment, saveQuiz, updateCourse } from "../../actions";

export const metadata: Metadata = { title: "Edit course" };

export default async function EditCourse({ params, searchParams }: PageProps<"/teach/courses/[courseId]">) {
  const { courseId } = await params;
  const db = await getDb();
  const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
  if (!course) notFound();
  const tasks = await db.query.assignments.findMany({ where: eq(schema.assignments.courseId, courseId), orderBy: asc(schema.assignments.week) });
  const quizList = await db.query.quizzes.findMany({ where: eq(schema.quizzes.courseId, courseId), orderBy: asc(schema.quizzes.week) });
  const cohorts = await db.query.cohorts.findMany({ where: eq(schema.cohorts.courseId, courseId), orderBy: desc(schema.cohorts.startsAt) });
  const suggestedStart = toLagosParts(addDays(new Date(), 28));

  return (
    <>
      <Link href="/teach/courses" className="text-sm text-muted hover:text-primary">
        ← Courses
      </Link>
      <PageTitle
        title={course.title}
        actions={
          <Link href={`/courses/${course.slug}`} className="btn-secondary btn-sm">
            View public page
          </Link>
        }
      />
      <Flash searchParams={searchParams} />

      <form action={updateCourse.bind(null, courseId)} className="card space-y-5">
        <h2 className="font-display text-lg font-semibold text-ink">Course details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input className="input" id="title" name="title" defaultValue={course.title} required />
          </div>
          <div>
            <label className="label" htmlFor="price">
              Price (₦)
            </label>
            <input className="input" id="price" name="price" type="number" min={0} step={500} defaultValue={course.priceKobo / 100} required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="tagline">
            One-line summary
          </label>
          <input className="input" id="tagline" name="tagline" defaultValue={course.tagline} />
        </div>
        <div>
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea className="input min-h-28" id="description" name="description" defaultValue={course.description} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="outcomes">
              What students will be able to do <span className="font-normal text-muted">(one per line)</span>
            </label>
            <textarea className="input min-h-36" id="outcomes" name="outcomes" defaultValue={course.outcomes} />
          </div>
          <div>
            <label className="label" htmlFor="audience">
              Who it&apos;s for <span className="font-normal text-muted">(one per line)</span>
            </label>
            <textarea className="input min-h-36" id="audience" name="audience" defaultValue={course.audience} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="outline">
            Week-by-week outline <span className="font-normal text-muted">(one week per line: Title | short summary)</span>
          </label>
          <textarea
            className="input min-h-40 font-mono text-xs"
            id="outline"
            name="outline"
            defaultValue={course.outline.map((w) => `${w.title} | ${w.summary}`).join("\n")}
          />
          <p className="mt-1 text-xs text-muted">New intakes get one weekly class per line.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="attendance">
              Attendance needed for the certificate (%)
            </label>
            <input className="input" id="attendance" name="attendance" type="number" min={0} max={100} defaultValue={course.completionAttendancePercent} />
          </div>
          <div>
            <label className="label" htmlFor="accent">
              Colour
            </label>
            <select className="input" id="accent" name="accent" defaultValue={course.accent}>
              <option value="blue">Electric blue</option>
              <option value="violet">Violet</option>
            </select>
          </div>
          <div className="space-y-2 pt-7 text-sm text-ink">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="requiresFinalProject" defaultChecked={course.requiresFinalProject} /> Final project must pass
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="published" defaultChecked={course.published} /> Published (visible to students)
            </label>
          </div>
        </div>
        <button className="btn-primary">Save course</button>
      </form>

      <section id="intakes" className="card mt-6 scroll-mt-24">
        <h2 className="font-display text-lg font-semibold text-ink">Intakes</h2>
        <ul className="mt-3 divide-y divide-line">
          {cohorts.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
              <Link href={`/teach/cohorts/${c.id}`} className="font-medium text-primary hover:underline">
                {c.name}
              </Link>
              <span className="text-muted">Starts {formatDate(c.startsAt)}</span>
            </li>
          ))}
        </ul>
        <form action={createCohort.bind(null, courseId)} className="mt-5 rounded-xl bg-surface-2 p-4">
          <h3 className="font-semibold text-ink">Open a new intake</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-5">
            <div className="sm:col-span-1">
              <label className="label" htmlFor="name">
                Name
              </label>
              <input className="input" id="name" name="name" placeholder="March 2027" required />
            </div>
            <div>
              <label className="label" htmlFor="date">
                First class
              </label>
              <input className="input" id="date" name="date" type="date" defaultValue={suggestedStart.date} required />
            </div>
            <div>
              <label className="label" htmlFor="time">
                Time (Lagos)
              </label>
              <input className="input" id="time" name="time" type="time" defaultValue="19:00" required />
            </div>
            <div>
              <label className="label" htmlFor="capacity">
                Seats
              </label>
              <input className="input" id="capacity" name="capacity" type="number" min={1} defaultValue={30} />
            </div>
            <div>
              <label className="label" htmlFor="meetUrl">
                Google Meet link
              </label>
              <input className="input" id="meetUrl" name="meetUrl" type="url" placeholder="https://meet.google.com/…" />
            </div>
          </div>
          <button className="btn-primary btn-sm mt-3">Create intake</button>
          <p className="mt-2 text-xs text-muted">Classes are created weekly from the first date, with notes copied from the last intake.</p>
        </form>
      </section>

      <section id="assignments" className="card mt-6 scroll-mt-24">
        <h2 className="font-display text-lg font-semibold text-ink">Assignments</h2>
        <div className="mt-4 space-y-4">
          {tasks.map((t) => (
            <details key={t.id} className="rounded-xl border border-line p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-2">
                <span className="font-medium text-ink">
                  Week {t.week}: {t.title}
                </span>
                {t.isFinalProject && <Pill tone="violet">Final project</Pill>}
              </summary>
              <AssignmentForm courseId={courseId} task={t} />
              <form action={deleteAssignment.bind(null, courseId, t.id)} className="mt-2">
                <button className="text-xs text-danger hover:underline">Delete assignment</button>
              </form>
            </details>
          ))}
          <details className="rounded-xl border border-dashed border-line p-4">
            <summary className="cursor-pointer font-medium text-primary">+ Add an assignment</summary>
            <AssignmentForm courseId={courseId} />
          </details>
        </div>
      </section>

      <section id="quizzes" className="card mt-6 scroll-mt-24">
        <h2 className="font-display text-lg font-semibold text-ink">Quizzes</h2>
        <p className="mt-1 text-sm text-muted">
          Write questions as text: a line starting <code>Q:</code>, then one answer per line starting <code>-</code>. Mark the right answer with <code>*</code>.
        </p>
        <div className="mt-4 space-y-4">
          {quizList.map((q) => (
            <details key={q.id} className="rounded-xl border border-line p-4">
              <summary className="cursor-pointer font-medium text-ink">
                Week {q.week}: {q.title} <span className="text-sm font-normal text-muted">({q.questions.length} questions)</span>
              </summary>
              <QuizForm courseId={courseId} quiz={q} />
              <form action={deleteQuiz.bind(null, courseId, q.id)} className="mt-2">
                <button className="text-xs text-danger hover:underline">Delete quiz</button>
              </form>
            </details>
          ))}
          <details className="rounded-xl border border-dashed border-line p-4">
            <summary className="cursor-pointer font-medium text-primary">+ Add a quiz</summary>
            <QuizForm courseId={courseId} />
          </details>
        </div>
      </section>
    </>
  );
}

function AssignmentForm({ courseId, task }: { courseId: string; task?: typeof schema.assignments.$inferSelect }) {
  return (
    <form action={saveAssignment.bind(null, courseId, task?.id ?? null)} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
        <div>
          <label className="label">Week</label>
          <input className="input" name="week" type="number" min={1} defaultValue={task?.week ?? 1} />
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" name="title" defaultValue={task?.title} required />
        </div>
      </div>
      <div>
        <label className="label">Brief</label>
        <textarea className="input min-h-24" name="brief" defaultValue={task?.brief} required />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="isFinalProject" defaultChecked={task?.isFinalProject} /> This is the final project (counts for the certificate)
      </label>
      <button className="btn-primary btn-sm">Save assignment</button>
    </form>
  );
}

function QuizForm({ courseId, quiz }: { courseId: string; quiz?: typeof schema.quizzes.$inferSelect }) {
  return (
    <form action={saveQuiz.bind(null, courseId, quiz?.id ?? null)} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
        <div>
          <label className="label">Week</label>
          <input className="input" name="week" type="number" min={1} defaultValue={quiz?.week ?? 1} />
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" name="title" defaultValue={quiz?.title} required />
        </div>
      </div>
      <div>
        <label className="label">Questions</label>
        <textarea
          className="input min-h-48 font-mono text-xs"
          name="questions"
          defaultValue={quiz ? quizToText(quiz.questions) : "Q: Your question?\n- A wrong answer\n* The right answer\n- Another wrong answer"}
          required
        />
      </div>
      <button className="btn-primary btn-sm">Save quiz</button>
    </form>
  );
}
