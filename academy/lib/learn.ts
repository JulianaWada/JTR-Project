import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb, schema, type Database } from "@/lib/db";
import { lockedWeeks } from "@/lib/unlock";
import { addMinutes } from "@/lib/time";

/** The signed-in student's active enrolment in a cohort, or a 404. Teachers can look at any cohort. */
export async function requireCohortAccess(cohortId: string, next: string) {
  const user = await requireUser(next);
  const db = await getDb();
  const cohort = await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, cohortId) });
  if (!cohort) notFound();
  if (user.role !== "teacher") {
    const enrolment = await db.query.enrolments.findFirst({
      where: and(eq(schema.enrolments.userId, user.id), eq(schema.enrolments.cohortId, cohortId), eq(schema.enrolments.status, "active")),
    });
    if (!enrolment) notFound();
  }
  const course = (await db.query.courses.findFirst({ where: eq(schema.courses.id, cohort.courseId) }))!;
  return { db, user, cohort, course };
}

export type ClassState = "upcoming" | "open" | "live" | "ended";

/** Students can join from 30 minutes before a class until it ends. */
export function classState(lesson: { startsAt: Date; durationMinutes: number }, now = new Date()): ClassState {
  if (now > addMinutes(lesson.startsAt, lesson.durationMinutes)) return "ended";
  if (now >= lesson.startsAt) return "live";
  if (now >= addMinutes(lesson.startsAt, -30)) return "open";
  return "upcoming";
}

export function untilText(date: Date, now = new Date()) {
  const minutes = Math.round((date.getTime() - now.getTime()) / 60000);
  if (minutes < 60) return `in ${Math.max(1, minutes)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours} hours`;
  return `in ${Math.round(hours / 24)} days`;
}

/** When a live course's week (or day) opens for this student, or null if it is already open. */
export async function weekOpensAt(
  db: Database,
  cohort: { id: string; selfPaced: boolean },
  user: { role: string },
  week: number,
  now = new Date(),
): Promise<Date | null> {
  if (cohort.selfPaced || user.role === "teacher") return null;
  const lessons = await db.query.classes.findMany({ where: and(eq(schema.classes.cohortId, cohort.id), eq(schema.classes.week, week)) });
  return lockedWeeks(lessons, cohort, user, now).get(week) ?? null;
}
