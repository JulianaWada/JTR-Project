import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseArt } from "@/components/course-art";
import { Pill } from "@/components/ui";
import { lines, openCohorts } from "@/lib/catalog";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { naira } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const db = await getDb();
  const course = await db.query.courses.findFirst({ where: eq(schema.courses.slug, slug) });
  if (!course || !course.published) return null;
  return { course, intakes: await openCohorts(db, course.id) };
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const data = await load((await params).slug);
  return data ? { title: data.course.title, description: data.course.tagline } : {};
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { course, intakes } = data;
  const violet = course.accent === "violet";
  const recorded = course.format === "recorded";
  const selfPaced = recorded ? intakes.find((i) => i.selfPaced) : undefined;

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-site gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:py-16">
          <div>
            <Link href="/#courses" className="text-sm text-muted hover:text-primary">
              ← All courses
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone={violet ? "violet" : "primary"}>{recorded ? "Video course" : "Live online course"}</Pill>
              <Pill>{recorded ? `${course.outline.length} lessons · learn at your own pace` : `${course.outline.length} weeks · 1 class a week`}</Pill>
              <Pill>Certificate</Pill>
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold text-balance text-ink sm:text-5xl">{course.title}</h1>
            <p className="mt-4 text-lg text-muted">{course.tagline}</p>
            <p className="mt-6 max-w-2xl leading-relaxed text-ink">{course.description}</p>
          </div>
          <div className="cut-corner overflow-hidden rounded-card border border-line">
            <CourseArt slug={course.slug} accent={course.accent} className="h-56" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-site gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">What you&apos;ll be able to do</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {lines(course.outcomes).map((o) => (
                <li key={o} className="flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-ink">
                  <span className="text-success" aria-hidden>
                    ✓
                  </span>
                  {o}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">{recorded ? "Lesson by lesson" : "Week by week"}</h2>
            <ol className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
              {course.outline.map((w) => (
                <li key={w.week} className="flex gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-sm font-semibold text-ink">
                    {w.week}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{w.title}</h3>
                    <p className="mt-1 text-sm text-muted">{w.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">Who it&apos;s for</h2>
            <ul className="mt-4 list-disc space-y-2 ps-5 text-ink">
              {lines(course.audience).map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-card border border-line bg-surface p-6">
            <h2 className="font-display text-xl font-semibold text-ink">Earning your certificate</h2>
            <p className="mt-2 text-muted">
              {recorded
                ? course.completionAttendancePercent >= 100
                  ? "Watch every lesson"
                  : `Watch at least ${course.completionAttendancePercent}% of the lessons`
                : `Attend at least ${course.completionAttendancePercent}% of the live classes`}
              {course.requiresFinalProject ? " and pass the final project" : ""}. Your certificate is issued automatically, with a link anyone can use to verify
              it. You&apos;ll also collect badges along the way.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card">
            <p className="text-sm text-muted">Course fee</p>
            <p className="font-display text-4xl font-semibold text-ink">{naira(course.priceKobo)}</p>
            <p className="mt-1 text-xs text-muted">Pay with card, bank transfer or USSD via Paystack.</p>

            {recorded ? (
              selfPaced ? (
                <>
                  <p className="mt-6 text-sm text-muted">Start straight after paying. Your lessons stay in your dashboard to rewatch any time.</p>
                  <Link href={`/enrol/${selfPaced.id}`} className="btn-primary mt-4 w-full">
                    Enrol for {naira(course.priceKobo)}
                  </Link>
                </>
              ) : (
                <p className="mt-6 rounded-xl bg-surface-2 p-4 text-sm text-muted">Enrolment opens soon.</p>
              )
            ) : (
              <>
                <h2 className="mt-6 text-sm font-semibold text-ink">Choose your intake</h2>
                {intakes.length === 0 ? (
                  <div className="mt-3 rounded-xl bg-surface-2 p-4 text-sm text-muted">
                    <p>No intake is open right now.</p>
                    {/* The register-interest page lives on the website, not in this app. */}
                    <a href={`${env.websiteUrl}/academy/interest`} className="mt-2 inline-block font-medium text-primary hover:underline">
                      Tell me when the next one opens →
                    </a>
                  </div>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {intakes.map((intake) => (
                      <li key={intake.id} className="rounded-xl border border-line p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink">{intake.name}</p>
                            <p className="text-sm text-muted">
                              Starts {formatDate(intake.startsAt)}
                              {intake.classes[0] ? `, ${formatTime(intake.classes[0].startsAt)} Lagos time` : ""}
                            </p>
                            <p className="text-sm text-muted">{intake.classes.length} weekly live classes</p>
                          </div>
                          <Pill tone={intake.seatsLeft <= 5 ? "warning" : "success"}>{intake.seatsLeft === 0 ? "Full" : `${intake.seatsLeft} seats left`}</Pill>
                        </div>
                        {intake.seatsLeft > 0 && (
                          <Link href={`/enrol/${intake.id}`} className="btn-primary mt-4 w-full">
                            Enrol for {naira(course.priceKobo)}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            <ul className="mt-6 space-y-2 border-t border-line pt-4 text-sm text-muted">
              {recorded ? (
                <>
                  <li>✓ {course.outline.length} video lessons with Jules, watch any time</li>
                  <li>✓ Notes, assignments and quizzes for every lesson</li>
                </>
              ) : (
                <>
                  <li>✓ Live classes with Jules on Google Meet</li>
                  <li>✓ Recordings and notes after every class</li>
                </>
              )}
              <li>✓ AI tutor available any time</li>
              <li>✓ Badges and a verified certificate</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
