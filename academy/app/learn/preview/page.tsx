import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CourseArt } from "@/components/course-art";
import { Empty, PageTitle, Pill } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { previewCourses } from "@/lib/student";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "Student view" };

/** Teacher only: open any course exactly as a student sees it, without enrolling or paying. */
export default async function StudentView() {
  const user = await requireUser("/learn/preview");
  if (user.role !== "teacher") redirect("/learn");
  const courses = await previewCourses(await getDb());

  return (
    <>
      <PageTitle eyebrow="Teacher" title="Student view">
        Open any course to see exactly what your students see: lessons, classes, notes, quizzes and the AI tutor. You don&apos;t need to enroll
        or pay, and nothing you do here counts as a student&apos;s progress.
      </PageTitle>

      {courses.length === 0 ? (
        <Empty>There are no courses yet.</Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {courses.map(({ course, intakes, main }) => (
            <article key={course.id} className="overflow-hidden rounded-card border border-line bg-surface shadow-[var(--card-shadow)]">
              <CourseArt slug={course.slug} accent={course.accent} className="h-36" />
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={course.accent === "violet" ? "violet" : "primary"}>{course.format === "recorded" ? "Video course" : "Live course"}</Pill>
                  {!course.published && <Pill tone="warning">Not published</Pill>}
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold text-ink">{course.title}</h2>
                {main ? (
                  <>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href={`/learn/${main.id}`} className="btn-primary">
                        Open as a student
                      </Link>
                      <Link href={`/learn/${main.id}/tutor`} className="btn-secondary">
                        Try the AI tutor
                      </Link>
                    </div>
                    {intakes.length > 1 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Other intakes</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {intakes
                            .filter((i) => i.cohort.id !== main.id)
                            .map(({ cohort, finished }) => (
                              <li key={cohort.id}>
                                <Link href={`/learn/${cohort.id}`} className="font-medium text-primary hover:underline">
                                  {cohort.name}
                                </Link>{" "}
                                <span className="text-muted">
                                  · {cohort.selfPaced ? "self-paced" : `starts ${formatDateTime(cohort.startsAt)}`}
                                  {finished ? " · finished" : ""}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted">
                    No intake yet, so there&apos;s nothing to show students.{" "}
                    <Link href={`/teach/courses/${course.id}`} className="font-medium text-primary hover:underline">
                      Add an intake
                    </Link>
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
