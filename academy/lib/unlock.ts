import { fromLagos, toLagosParts } from "@/lib/time";

// Live courses: each class's notes, slides, links and files, quiz and assignment stay locked
// until the day of that class, then open at midnight Lagos time. Recorded (self-paced) courses
// are always open, and the teacher always sees everything.

type Lesson = { week: number; startsAt: Date };
type Viewer = { role: string } | null | undefined;

/** Midnight Lagos time on the day of the class. */
export function unlocksAt(lesson: { startsAt: Date }): Date {
  return fromLagos(toLagosParts(lesson.startsAt).date, "00:00")!;
}

/** True while a student still has to wait for this class's resources. */
export function isLocked(lesson: { startsAt: Date }, cohort: { selfPaced: boolean }, viewer: Viewer, now = new Date()): boolean {
  if (cohort.selfPaced || viewer?.role === "teacher") return false;
  return now < unlocksAt(lesson);
}

/**
 * The weeks (or days) whose quiz and assignment are still locked, mapped to when they open.
 * A week opens with its first class, so a week with no class at all is never locked.
 */
export function lockedWeeks(lessons: Lesson[], cohort: { selfPaced: boolean }, viewer: Viewer, now = new Date()): Map<number, Date> {
  const first = new Map<number, Lesson>();
  for (const l of lessons) {
    const seen = first.get(l.week);
    if (!seen || l.startsAt < seen.startsAt) first.set(l.week, l);
  }
  const locked = new Map<number, Date>();
  for (const [week, l] of first) if (isLocked(l, cohort, viewer, now)) locked.set(week, unlocksAt(l));
  return locked;
}
