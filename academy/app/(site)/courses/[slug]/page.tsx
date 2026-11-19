import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseArt } from "@/components/course-art";
import { Pill } from "@/components/ui";
import { lines, openCohorts } from "@/lib/catalog";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { localPrice, visitorCountry } from "@/lib/location";
import { money } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/time";
import { lessonLabel } from "@/lib/lesson-unit";
import { asset } from "@/lib/assets";
import { brandFor, type TeacherBrand } from "@/lib/teachers";
import { Stars } from "@/components/stars";
import { formatRating, publicReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const db = await getDb();
  const course = await db.query.courses.findFirst({ where: eq(schema.courses.slug, slug) });
  if (!course) return null;
  // A hidden (unpublished) course keeps its address, so old links and flyer QR codes land on a "not open right now" note instead of an error.
  if (!course.published) return { closed: course } as const;
  const teacher = await brandFor(db, course.teacherId);
  // A course whose teacher was suspended is off sale until the admin hands it on.
  if (course.teacherId && !teacher.userId) return null;
  return { course, teacher, intakes: await openCohorts(db, course.id), reviews: await publicReviews(db, course.id) };
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const data = await load((await params).slug);
  if (data?.closed) return { title: data.closed.title, robots: { index: false } };
  return data ? { title: data.course.title, description: data.course.tagline } : {};
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const data = await load((await params).slug);
  if (!data) notFound();
  if (data.closed) return <CourseClosed title={data.closed.title} />;
  const { course, intakes, teacher, reviews } = data;
  const local = localPrice(await visitorCountry(), course);
  const price = money(local.minor, local.currency);
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
              <Pill>{recorded ? `${course.outline.length} lessons · learn at your own pace` : course.lessonUnit === "day" ? `${course.outline.length} days · 1 class a day` : `${course.outline.length} weeks · 1 class a week`}</Pill>
              <Pill>Certificate</Pill>
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold text-balance text-navy sm:text-5xl dark:text-ink">{course.title}</h1>
            <p className="mt-4 text-lg font-medium text-primary">{course.tagline}</p>
            {reviews.total > 0 && (
              <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-sm hover:underline">
                <span className="font-semibold text-ink">{formatRating(reviews.average)}</span>
                <Stars value={reviews.average} className="text-base" />
                <span className="text-muted">
                  {reviews.total} student {reviews.total === 1 ? "rating" : "ratings"}
                </span>
              </a>
            )}
            <p className="mt-6 max-w-2xl leading-relaxed text-ink">{course.description}</p>
            {teacher.userId && <TaughtBy teacher={teacher} />}
          </div>
          <div className="cut-corner overflow-hidden rounded-card border border-line">
            <CourseArt slug={course.slug} accent={course.accent} className="h-full min-h-56" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-site gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <section>
            <h2 className="heading-accent font-display text-2xl font-semibold text-primary">What you&apos;ll be able to do</h2>
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
            <h2 className="heading-accent font-display text-2xl font-semibold text-primary">{recorded ? "Lesson by lesson" : `${lessonLabel(course)} by ${lessonLabel(course).toLowerCase()}`}</h2>
            <ol className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
              {course.outline.map((w) => (
                <li key={w.week} className="flex gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-soft font-display text-sm font-semibold text-gold-ink ring-1 ring-gold">
                    {w.week}
                  </span>
                  <div>
                    <h3 className="font-semibold text-primary">{w.title}</h3>
                    <p className="mt-1 text-sm text-muted">{w.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="heading-accent font-display text-2xl font-semibold text-primary">Who it&apos;s for</h2>
            <ul className="mt-4 list-disc space-y-2 ps-5 text-ink">
              {lines(course.audience).map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>

          {reviews.total > 0 && <StudentReviews reviews={reviews} />}

          <section className="rounded-card border border-line bg-surface p-6">
            <h2 className="heading-accent font-display text-xl font-semibold text-primary">Earning your certificate</h2>
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
            <p className="font-display text-4xl font-semibold text-primary">{price}</p>
            <p className="mt-1 text-xs text-muted">
              {local.currency === "USD" ? "Pay by card in US dollars via Paystack." : "Pay with card, bank transfer or USSD via Paystack."}
            </p>

            {recorded ? (
              selfPaced ? (
                <>
                  <p className="mt-6 text-sm text-muted">Start straight after paying. Your lessons stay in your dashboard to rewatch any time.</p>
                  <Link href={`/enrol/${selfPaced.id}`} className="btn-primary mt-4 w-full">
                    Enroll for {price}
                  </Link>
                </>
              ) : (
                <p className="mt-6 rounded-xl bg-surface-2 p-4 text-sm text-muted">Enrollment opens soon.</p>
              )
            ) : (
              <>
                <h2 className="mt-6 text-sm font-semibold text-primary">Choose your intake</h2>
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
                            <p className="text-sm text-muted">{intake.classes.length} {course.lessonUnit === "day" ? "daily" : "weekly"} live classes</p>
                          </div>
                          <Pill tone={intake.seatsLeft === 0 ? "warning" : "success"}>{intake.seatsLeft === 0 ? "Full" : "Open"}</Pill>
                        </div>
                        {intake.seatsLeft > 0 && (
                          <Link href={`/enrol/${intake.id}`} className="btn-primary mt-4 w-full">
                            Enroll for {price}
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
                  <li>✓ {course.outline.length} video lessons from skilled teachers, watch any time</li>
                  <li>✓ Notes, assignments and quizzes for every lesson</li>
                </>
              ) : (
                <>
                  <li>✓ Live classes with skilled teachers in the JTR online class room</li>
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

/** Average stars, how many gave each number of stars, and the latest written reviews. */
function StudentReviews({ reviews }: { reviews: Awaited<ReturnType<typeof publicReviews>> }) {
  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="heading-accent font-display text-2xl font-semibold text-primary">What students say</h2>
      <div className="mt-4 grid gap-6 rounded-card border border-line bg-surface p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center sm:pe-6">
          <p className="font-display text-5xl font-semibold text-ink">{formatRating(reviews.average)}</p>
          <Stars value={reviews.average} className="mt-2 text-xl" />
          <p className="mt-1 text-sm text-muted">
            {reviews.total} {reviews.total === 1 ? "rating" : "ratings"}
          </p>
        </div>
        <ul className="space-y-1.5">
          {reviews.breakdown.map((b) => (
            <li key={b.stars} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0 text-muted">{b.stars} star</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full rounded-full bg-gold" style={{ width: `${(b.count / reviews.total) * 100}%` }} />
              </span>
              <span className="w-6 shrink-0 text-end text-muted">{b.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {reviews.reviews.length > 0 && (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {reviews.reviews.map((r) => (
            <li key={r.id} className="flex flex-col rounded-card border border-line bg-surface p-5">
              <Stars value={r.rating} className="text-base" />
              <p className="mt-3 flex-1 text-sm leading-relaxed whitespace-pre-line text-ink">&ldquo;{r.comment}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold text-ink">
                {r.name}
                <span className="font-normal text-muted">
                  {" "}
                  · {r.intake ? `${r.intake} intake` : "Verified student"} · {formatDate(r.date)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The course's own teacher: their logo, name, line and bio, in their brand colour. */
function TaughtBy({ teacher }: { teacher: TeacherBrand }) {
  return (
    <div className="mt-8 flex max-w-2xl gap-4 rounded-card border border-line bg-surface p-5" style={{ borderInlineStartColor: teacher.color, borderInlineStartWidth: 4 }}>
      {teacher.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- the teacher's uploaded logo
        <img src={asset(teacher.logo)} alt="" className="size-14 shrink-0 rounded-xl border border-line bg-white object-contain p-0.5" />
      ) : (
        <span className="grid size-14 shrink-0 place-items-center rounded-xl font-display text-xl font-bold text-white" style={{ background: teacher.color }}>
          {teacher.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Taught by</p>
        <p className="font-display text-lg font-semibold text-ink">
          {teacher.name}
          {teacher.person && teacher.person !== teacher.name && <span className="font-sans text-sm font-normal text-muted"> · {teacher.person}</span>}
        </p>
        {teacher.headline && <p className="text-sm font-medium text-ink">{teacher.headline}</p>}
        {teacher.bio && <p className="mt-2 text-sm whitespace-pre-line text-muted">{teacher.bio}</p>}
        {teacher.website && (
          <a href={teacher.website} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
            Website →
          </a>
        )}
      </div>
    </div>
  );
}

function CourseClosed({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <Pill>Not open right now</Pill>
      <h1 className="mt-4 font-display text-3xl font-semibold text-balance text-ink sm:text-4xl">{title}</h1>
      <p className="mt-4 text-lg text-muted">This course isn&apos;t taking students at the moment. Have a look at the courses that are open now.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/#courses" className="btn-primary h-12 px-7 text-base">
          See the courses
        </Link>
        <a href={`${env.websiteUrl}/contact`} className="btn-secondary h-12 px-7 text-base">
          Contact JTR
        </a>
      </div>
    </section>
  );
}
