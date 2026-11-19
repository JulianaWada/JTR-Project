import { and, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Stars } from "@/components/stars";
import { Empty, Flash, PageTitle, Pill, Stat } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { formatRating } from "@/lib/reviews";
import { ownCourses } from "@/lib/teachers";
import { formatDate } from "@/lib/time";
import { setReviewStatus } from "./actions";

export const metadata: Metadata = { title: "Reviews" };

type Filter = "all" | "feedback" | "low" | "hidden";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "feedback", label: "With private feedback" },
  { key: "low", label: "3 stars or fewer" },
  { key: "hidden", label: "Hidden" },
];

export default async function Reviews({ searchParams }: PageProps<"/teach/reviews">) {
  const user = await requireTeacher();
  const db = await getDb();
  const params = await searchParams;
  const courses = await db.query.courses.findMany({ where: ownCourses(user), orderBy: schema.courses.sortOrder });
  const courseIds = courses.map((c) => c.id);
  const rows = courseIds.length
    ? await db
        .select({
          review: schema.courseReviews,
          name: schema.users.name,
          email: schema.users.email,
          cohortName: schema.cohorts.name,
          selfPaced: schema.cohorts.selfPaced,
        })
        .from(schema.courseReviews)
        .innerJoin(schema.users, eq(schema.users.id, schema.courseReviews.userId))
        .innerJoin(schema.cohorts, eq(schema.cohorts.id, schema.courseReviews.cohortId))
        .where(and(inArray(schema.courseReviews.courseId, courseIds)))
        .orderBy(desc(schema.courseReviews.updatedAt))
    : [];

  const courseFilter = typeof params.course === "string" && courseIds.includes(params.course) ? params.course : null;
  const filter: Filter = FILTERS.some((f) => f.key === params.show) ? (params.show as Filter) : "all";
  const inCourse = courseFilter ? rows.filter((r) => r.review.courseId === courseFilter) : rows;
  const shown = inCourse.filter((r) =>
    filter === "feedback" ? r.review.feedback : filter === "low" ? r.review.rating <= 3 : filter === "hidden" ? r.review.status === "hidden" : true,
  );

  const published = inCourse.filter((r) => r.review.status === "published");
  const average = published.length ? published.reduce((sum, r) => sum + r.review.rating, 0) / published.length : 0;
  const withFeedback = inCourse.filter((r) => r.review.feedback).length;
  const perCourse = courses
    .map((c) => {
      const mine = rows.filter((r) => r.review.courseId === c.id && r.review.status === "published");
      return { course: c, count: mine.length, average: mine.length ? mine.reduce((s, r) => s + r.review.rating, 0) / mine.length : 0 };
    })
    .filter((c) => c.count > 0 || rows.some((r) => r.review.courseId === c.course.id));

  const href = (next: { course?: string | null; show?: Filter }) => {
    const qs = new URLSearchParams();
    const c = next.course === undefined ? courseFilter : next.course;
    const s = next.show ?? filter;
    if (c) qs.set("course", c);
    if (s !== "all") qs.set("show", s);
    const q = qs.toString();
    return q ? `/teach/reviews?${q}` : "/teach/reviews";
  };
  const here = href({});

  return (
    <>
      <PageTitle eyebrow="Teacher" title="Reviews and feedback">
        Students rate {user.isAdmin ? "a course" : "your courses"} and can leave a review when they reach the end. Reviews show on the course page straight
        away; hide any that shouldn&apos;t be public. Private feedback is only ever shown here.
      </PageTitle>
      <Flash searchParams={searchParams} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Average rating"
          value={
            published.length ? (
              <span className="flex items-center gap-2">
                {formatRating(average)} <Stars value={average} className="text-lg" />
              </span>
            ) : (
              "No ratings yet"
            )
          }
          hint="From reviews shown on the course page"
        />
        <Stat label="Ratings" value={inCourse.length} hint={`${inCourse.filter((r) => r.review.comment).length} with a written review`} />
        <Stat label="Private feedback" value={withFeedback} hint="Notes only you can read" />
      </div>

      {perCourse.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={href({ course: null })} className={`pill ${!courseFilter ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-ink"}`}>
            All courses
          </Link>
          {perCourse.map(({ course, count, average }) => (
            <Link
              key={course.id}
              href={href({ course: course.id })}
              className={`pill ${courseFilter === course.id ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-ink"}`}
            >
              {course.title} · {count ? `${formatRating(average)}★ (${count})` : "hidden only"}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-b border-line pb-4">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href({ show: f.key })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === f.key ? "bg-primary-soft text-primary" : "text-muted hover:text-ink"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-6">
          <Empty>
            {rows.length === 0
              ? "No reviews yet. Students are asked to rate the course once they reach the end of it."
              : "No reviews match this filter."}
          </Empty>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map(({ review, name, email, cohortName, selfPaced }) => {
            const course = courses.find((c) => c.id === review.courseId);
            const hidden = review.status === "hidden";
            return (
              <li key={review.id} className={`card ${hidden ? "opacity-75" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars value={review.rating} className="text-lg" />
                      {hidden ? <Pill tone="warning">Hidden</Pill> : <Pill tone="success">On the course page</Pill>}
                    </div>
                    <p className="mt-2 font-medium text-ink">
                      {name} <span className="font-normal text-muted">· {email}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {course?.title} · {selfPaced ? "video course" : `${cohortName} intake`} · {formatDate(review.updatedAt)}
                      {review.updatedAt.getTime() - review.createdAt.getTime() > 60_000 ? " (edited)" : ""}
                    </p>
                  </div>
                  <form action={setReviewStatus.bind(null, review.id, hidden ? "published" : "hidden", here)}>
                    <button className="btn-secondary btn-sm">{hidden ? "Show on course page" : "Hide from course page"}</button>
                  </form>
                </div>
                {review.comment ? (
                  <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-ink">&ldquo;{review.comment}&rdquo;</p>
                ) : (
                  <p className="mt-4 text-sm text-muted">Stars only, no written review.</p>
                )}
                {review.feedback && (
                  <div className="mt-4 rounded-xl border border-gold/60 bg-gold-soft/40 p-4">
                    <p className="text-xs font-semibold tracking-wide text-gold-ink uppercase">🔒 Private feedback for you</p>
                    <p className="mt-1 text-sm whitespace-pre-line text-ink">{review.feedback}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
