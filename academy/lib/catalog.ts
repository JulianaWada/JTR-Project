import { and, asc, eq, gt, or } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { classes, cohorts, courses } from "@/lib/db/schema";
import { seatsTaken } from "@/lib/enrolment";
import { brandsFor, JTR_BRAND } from "@/lib/teachers";

export type CourseRow = typeof courses.$inferSelect;
export type CohortRow = typeof cohorts.$inferSelect;

/** Cohorts students can still join (a self-paced one at any time), soonest first, with seats left. */
export async function openCohorts(db: Database, courseId: string, now = new Date()) {
  const rows = await db.query.cohorts.findMany({
    where: and(eq(cohorts.courseId, courseId), eq(cohorts.enrolmentOpen, true), or(gt(cohorts.startsAt, now), eq(cohorts.selfPaced, true))),
    orderBy: asc(cohorts.startsAt),
  });
  return Promise.all(
    rows.map(async (c) => {
      const lessons = await db.query.classes.findMany({ where: eq(classes.cohortId, c.id), orderBy: asc(classes.startsAt) });
      return { ...c, seatsLeft: Math.max(0, c.capacity - (await seatsTaken(db, c.id))), classes: lessons };
    }),
  );
}

/** Published courses, with their teacher's brand. Courses of a teacher who isn't approved (e.g. suspended) are left out. */
export async function publishedCourses(db: Database) {
  const rows = await db.query.courses.findMany({ where: eq(courses.published, true), orderBy: asc(courses.sortOrder) });
  const brands = await brandsFor(db, rows.map((c) => c.teacherId));
  const listed = rows.filter((c) => !c.teacherId || brands.has(c.teacherId));
  return Promise.all(
    listed.map(async (course) => ({
      ...course,
      teacher: course.teacherId ? brands.get(course.teacherId)! : JTR_BRAND,
      nextCohort: (await openCohorts(db, course.id))[0] ?? null,
    })),
  );
}

export function lines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
