import { and, asc, eq, gt } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { classes, cohorts, courses } from "@/lib/db/schema";
import { seatsTaken } from "@/lib/enrolment";

export type CourseRow = typeof courses.$inferSelect;
export type CohortRow = typeof cohorts.$inferSelect;

/** Cohorts students can still join, soonest first, with seats left. */
export async function openCohorts(db: Database, courseId: string, now = new Date()) {
  const rows = await db.query.cohorts.findMany({
    where: and(eq(cohorts.courseId, courseId), eq(cohorts.enrolmentOpen, true), gt(cohorts.startsAt, now)),
    orderBy: asc(cohorts.startsAt),
  });
  return Promise.all(
    rows.map(async (c) => {
      const lessons = await db.query.classes.findMany({ where: eq(classes.cohortId, c.id), orderBy: asc(classes.startsAt) });
      return { ...c, seatsLeft: Math.max(0, c.capacity - (await seatsTaken(db, c.id))), classes: lessons };
    }),
  );
}

export async function publishedCourses(db: Database) {
  const rows = await db.query.courses.findMany({ where: eq(courses.published, true), orderBy: asc(courses.sortOrder) });
  return Promise.all(rows.map(async (course) => ({ ...course, nextCohort: (await openCohorts(db, course.id))[0] ?? null })));
}

export function lines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
