import { and, asc, desc, eq, ne } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { classes, cohorts, courses } from "@/lib/db/schema";
import { courseTemplates } from "@/lib/course-content";
import { addMinutes } from "@/lib/time";

/** Seats are not limited on a recorded course. */
export const SELF_PACED_CAPACITY = 100_000;

/**
 * Gives every recorded course its self-paced intake, with one video lesson per week.
 * Lessons are copied from the course's latest live intake, else the starter content, else the outline.
 * Live intakes of the course stop taking enrolments. Runs on every start; does nothing once the intake exists.
 */
export async function ensureSelfPacedCohorts(db: Database, now = new Date()) {
  const recorded = await db.query.courses.findMany({ where: eq(courses.format, "recorded") });
  const created = [];
  for (const course of recorded) {
    const existing = await db.query.cohorts.findFirst({ where: and(eq(cohorts.courseId, course.id), eq(cohorts.selfPaced, true)) });
    if (existing) continue;

    const latest = await db.query.cohorts.findFirst({ where: eq(cohorts.courseId, course.id), orderBy: desc(cohorts.startsAt) });
    const copied = latest ? await db.query.classes.findMany({ where: eq(classes.cohortId, latest.id), orderBy: asc(classes.week) }) : [];
    const template = courseTemplates.find((t) => t.slug === course.slug);
    const weeks = course.outline.length ? course.outline : [{ week: 1, title: "Lesson 1", summary: "" }];
    const lessons = weeks.map((w) => {
      const fromIntake = copied.find((c) => c.week === w.week);
      const fromTemplate = template?.lessons.find((l) => l.week === w.week);
      return {
        week: w.week,
        title: fromIntake?.title ?? fromTemplate?.title ?? w.title,
        notes: fromIntake?.notes || fromTemplate?.notes || w.summary,
        resources: fromIntake?.resources.length ? fromIntake.resources : (fromTemplate?.resources ?? []),
      };
    });

    const [cohort] = await db
      .insert(cohorts)
      .values({ courseId: course.id, name: "Self-paced", startsAt: now, capacity: SELF_PACED_CAPACITY, enrolmentOpen: true, selfPaced: true })
      .returning();
    // Lessons are ordered by start time everywhere, so they are spaced a minute apart in the past.
    const rows = await db
      .insert(classes)
      .values(
        lessons.map((l, i) => ({
          cohortId: cohort.id,
          ...l,
          startsAt: addMinutes(now, i - lessons.length),
          durationMinutes: 0,
        })),
      )
      .returning();
    await db
      .update(cohorts)
      .set({ enrolmentOpen: false })
      .where(and(eq(cohorts.courseId, course.id), ne(cohorts.id, cohort.id)));
    created.push({ cohort, classes: rows });
  }
  return created;
}
