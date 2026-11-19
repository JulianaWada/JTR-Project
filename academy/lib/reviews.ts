import { and, asc, avg, count, desc, eq, inArray, ne } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { attendance, certificates, classes, cohorts, courseReviews, users } from "@/lib/db/schema";
import { addMinutes } from "@/lib/time";

// Students rate a course (1 to 5 stars) and can write a public review plus private feedback for the teacher,
// once they reach the end of their intake. Reviews show on the course page straight away; the course's teacher
// (or the admin) can hide one. Hidden reviews don't count towards the average.

export { MAX_COMMENT, MAX_FEEDBACK } from "@/lib/review-limits";

import type { RatingSummary } from "@/lib/rating-format";
export { formatRating, type RatingSummary } from "@/lib/rating-format";

/**
 * Whether a student has reached the end of this intake, so can rate the course: they earned the certificate,
 * watched every lesson of a video course, or the last live class has ended.
 */
export async function canReview(db: Database, userId: string, cohortId: string, now = new Date()) {
  const certificate = await db.query.certificates.findFirst({
    where: and(eq(certificates.userId, userId), eq(certificates.cohortId, cohortId)),
    columns: { revokedAt: true },
  });
  if (certificate && !certificate.revokedAt) return true;
  const cohort = await db.query.cohorts.findFirst({ where: eq(cohorts.id, cohortId), columns: { selfPaced: true } });
  if (!cohort) return false;
  const lessons = await db.query.classes.findMany({ where: eq(classes.cohortId, cohortId), orderBy: asc(classes.startsAt) });
  if (!lessons.length) return false;
  if (!cohort.selfPaced) {
    const last = lessons[lessons.length - 1];
    return now > addMinutes(last.startsAt, last.durationMinutes);
  }
  const watched = await db.query.attendance.findMany({
    where: and(eq(attendance.userId, userId), inArray(attendance.classId, lessons.map((l) => l.id))),
    columns: { classId: true },
  });
  return watched.length >= lessons.length;
}

/** The student's own review of a course, if they wrote one. */
export async function ownReview(db: Database, userId: string, courseId: string) {
  return (await db.query.courseReviews.findFirst({ where: and(eq(courseReviews.userId, userId), eq(courseReviews.courseId, courseId)) })) ?? null;
}

/** Average stars and number of ratings per course, counting published reviews only. Courses without any are left out. */
export async function ratingSummaries(db: Database, courseIds: string[]): Promise<Map<string, RatingSummary>> {
  if (!courseIds.length) return new Map();
  const rows = await db
    .select({ courseId: courseReviews.courseId, average: avg(courseReviews.rating), count: count() })
    .from(courseReviews)
    .where(and(inArray(courseReviews.courseId, courseIds), eq(courseReviews.status, "published")))
    .groupBy(courseReviews.courseId);
  return new Map(rows.map((r) => [r.courseId, { average: Number(r.average ?? 0), count: r.count }]));
}

/** What the course page shows: the average, how many gave each number of stars, and the latest written reviews. */
export async function publicReviews(db: Database, courseId: string, limit = 12) {
  const counts = await db
    .select({ rating: courseReviews.rating, count: count() })
    .from(courseReviews)
    .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.status, "published")))
    .groupBy(courseReviews.rating);
  const total = counts.reduce((sum, r) => sum + r.count, 0);
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: counts.find((c) => c.rating === stars)?.count ?? 0 }));
  const average = total ? counts.reduce((sum, r) => sum + r.rating * r.count, 0) / total : 0;
  const written = await db
    .select({ review: courseReviews, name: users.name, cohortName: cohorts.name, selfPaced: cohorts.selfPaced })
    .from(courseReviews)
    .innerJoin(users, eq(users.id, courseReviews.userId))
    .innerJoin(cohorts, eq(cohorts.id, courseReviews.cohortId))
    .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.status, "published"), ne(courseReviews.comment, "")))
    .orderBy(desc(courseReviews.rating), desc(courseReviews.updatedAt))
    .limit(limit);
  return {
    average,
    total,
    breakdown,
    reviews: written.map((r) => ({
      id: r.review.id,
      rating: r.review.rating,
      comment: r.review.comment,
      date: r.review.updatedAt,
      name: publicName(r.name),
      intake: r.selfPaced ? null : r.cohortName,
    })),
  };
}

/** "Ada Okafor" becomes "Ada O.": enough to feel real without putting a student's full name on a public page. */
export function publicName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A student";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
