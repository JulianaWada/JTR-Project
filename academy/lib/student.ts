import { and, asc, eq, gt, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { classes, cohorts, courses, enrolments, payments, userBadges } from "@/lib/db/schema";
import { getProgress } from "@/lib/progress";
import { addMinutes } from "@/lib/time";

/** Everything the student dashboard shows, one entry per course they've joined or started paying for. */
export async function studentOverview(db: Database, userId: string, now = new Date()) {
  const rows = await db.query.enrolments.findMany({ where: eq(enrolments.userId, userId), orderBy: asc(enrolments.createdAt) });
  return Promise.all(
    rows
      .filter((e) => e.status !== "cancelled")
      .map(async (e) => {
        const cohort = (await db.query.cohorts.findFirst({ where: eq(cohorts.id, e.cohortId) }))!;
        const course = (await db.query.courses.findFirst({ where: eq(courses.id, cohort.courseId) }))!;
        const nextClass = await db.query.classes.findFirst({
          where: and(eq(classes.cohortId, cohort.id), gt(classes.startsAt, addMinutes(now, -120))),
          orderBy: asc(classes.startsAt),
        });
        const pendingPayment =
          e.status === "pending"
            ? await db.query.payments.findFirst({
                where: and(eq(payments.enrolmentId, e.id), eq(payments.status, "pending")),
              })
            : undefined;
        const progress = e.status === "active" ? await getProgress(db, userId, cohort.id, now) : null;
        return { enrolment: e, cohort, course, nextClass: nextClass ?? null, pendingPayment: pendingPayment ?? null, progress };
      }),
  );
}

export async function badgesFor(db: Database, userId: string, cohortIds?: string[]) {
  return db.query.userBadges.findMany({
    where: cohortIds ? and(eq(userBadges.userId, userId), inArray(userBadges.cohortId, cohortIds.length ? cohortIds : ["00000000-0000-0000-0000-000000000000"])) : eq(userBadges.userId, userId),
    orderBy: asc(userBadges.awardedAt),
  });
}
