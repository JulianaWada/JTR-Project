import type { Metadata } from "next";
import Link from "next/link";
import { Flash, PageTitle, Pill } from "@/components/ui";
import { getDb } from "@/lib/db";
import { naira } from "@/lib/money";
import { courseWithCohorts } from "@/lib/teacher";
import { formatDate } from "@/lib/time";
import { createCourse } from "../actions";

export const metadata: Metadata = { title: "Courses" };

export default async function TeachCourses({ searchParams }: PageProps<"/teach/courses">) {
  const courses = await courseWithCohorts(await getDb());
  return (
    <>
      <PageTitle eyebrow="Teacher" title="Courses & intakes">
        Edit a course&apos;s details, outline, assignments and quizzes, or open a new intake.
      </PageTitle>
      <Flash searchParams={searchParams} />
      <div className="space-y-6">
        {courses.map(({ course, cohorts }) => (
          <section key={course.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  {course.published ? <Pill tone="success">Published</Pill> : <Pill tone="warning">Draft</Pill>}
                  <Pill>{naira(course.priceKobo)}</Pill>
                  <Pill tone={course.format === "recorded" ? "violet" : "primary"}>{course.format === "recorded" ? "Video course" : "Live classes"}</Pill>
                </div>
                <h2 className="mt-2 font-display text-xl font-semibold text-ink">{course.title}</h2>
                <p className="text-sm text-muted">{course.tagline}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/courses/${course.slug}`} className="btn-secondary btn-sm">
                  View page
                </Link>
                <Link href={`/teach/courses/${course.id}`} className="btn-primary btn-sm">
                  Edit course
                </Link>
              </div>
            </div>
            <table className="table mt-4">
              <thead>
                <tr>
                  <th>Intake</th>
                  <th>Starts</th>
                  <th>Students</th>
                  <th>Enrolment</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/teach/cohorts/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.selfPaced ? "Video lessons (self-paced)" : c.name}
                      </Link>
                    </td>
                    <td className="text-muted">{c.selfPaced ? "Any time" : formatDate(c.startsAt)}</td>
                    <td>{c.selfPaced ? c.students : `${c.students}/${c.capacity}`}</td>
                    <td>{c.enrolmentOpen ? <Pill tone="success">Open</Pill> : <Pill>Closed</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <section className="card mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Add a new course</h2>
        <p className="mt-1 text-sm text-muted">It starts as a draft with a 6-week outline. Publish it when it&apos;s ready.</p>
        <form action={createCourse} className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input className="input" id="title" name="title" required placeholder="e.g. Build a website with AI" />
          </div>
          <div>
            <label className="label" htmlFor="price">
              Price (₦)
            </label>
            <input className="input" id="price" name="price" type="number" min={0} step={500} required defaultValue={50000} />
          </div>
          <button className="btn-primary">Create course</button>
        </form>
      </section>
    </>
  );
}
