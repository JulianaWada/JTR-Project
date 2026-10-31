import { and, asc, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { classes, cohorts, courses, enrolments, payments, submissions } from "@/lib/db/schema";
import { addMinutes } from "@/lib/time";

export async function teacherOverview(db: Database, now = new Date()) {
  const paid = await db.query.payments.findMany({ where: eq(payments.status, "success") });
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const active = await db.query.enrolments.findMany({ where: eq(enrolments.status, "active") });
  const toMark = await db.query.submissions.findMany({ where: isNull(submissions.grade), orderBy: asc(submissions.submittedAt) });
  const upcoming = await db.query.classes.findMany({
    where: gt(classes.startsAt, addMinutes(now, -120)),
    orderBy: asc(classes.startsAt),
    limit: 5,
  });
  const cohortIds = [...new Set(upcoming.map((c) => c.cohortId))];
  const cohortRows = cohortIds.length ? await db.query.cohorts.findMany({ where: inArray(cohorts.id, cohortIds) }) : [];
  const courseRows = await db.query.courses.findMany();
  return {
    totalIncomeKobo: paid.reduce((s, p) => s + p.amountKobo, 0),
    monthIncomeKobo: paid.filter((p) => p.paidAt && p.paidAt >= monthStart).reduce((s, p) => s + p.amountKobo, 0),
    activeStudents: new Set(active.map((e) => e.userId)).size,
    activeEnrolments: active.length,
    toMark: toMark.length,
    upcoming: upcoming.map((c) => {
      const cohort = cohortRows.find((x) => x.id === c.cohortId)!;
      return { ...c, cohort, course: courseRows.find((x) => x.id === cohort.courseId)! };
    }),
  };
}

export async function courseWithCohorts(db: Database) {
  const rows = await db.query.courses.findMany({ orderBy: asc(courses.sortOrder) });
  return Promise.all(
    rows.map(async (course) => {
      const list = await db.query.cohorts.findMany({ where: eq(cohorts.courseId, course.id), orderBy: [desc(cohorts.selfPaced), desc(cohorts.startsAt)] });
      return {
        course,
        cohorts: await Promise.all(
          list.map(async (c) => ({
            ...c,
            students: (await db.query.enrolments.findMany({ where: and(eq(enrolments.cohortId, c.id), eq(enrolments.status, "active")) })).length,
          })),
        ),
      };
    }),
  );
}
