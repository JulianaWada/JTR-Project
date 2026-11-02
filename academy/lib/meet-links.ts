import { asc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { classes, cohorts, courses } from "@/lib/db/schema";
import { addMinutes } from "@/lib/time";

/** Live intakes that haven't finished yet, soonest first, with their class dates and Meet link. */
export async function liveIntakes(db: Database, now = new Date()) {
  const rows = await db
    .select({ cohort: cohorts, course: courses })
    .from(cohorts)
    .innerJoin(courses, eq(courses.id, cohorts.courseId))
    .where(eq(cohorts.selfPaced, false))
    .orderBy(asc(cohorts.startsAt));
  if (!rows.length) return [];
  const classRows = await db.query.classes.findMany({
    where: inArray(classes.cohortId, rows.map((r) => r.cohort.id)),
    orderBy: asc(classes.startsAt),
  });
  return rows
    .map(({ cohort, course }) => {
      const own = classRows.filter((c) => c.cohortId === cohort.id);
      const last = own.at(-1);
      return {
        cohort,
        course,
        classes: own,
        firstClass: own[0]?.startsAt ?? cohort.startsAt,
        endsAt: last ? addMinutes(last.startsAt, last.durationMinutes) : cohort.startsAt,
        /** Classes that use their own link instead of the intake's. */
        overrides: own.filter((c) => c.meetUrl).length,
      };
    })
    .filter((i) => i.endsAt > now);
}

/** A Meet, Zoom or Teams link must be a full https:// address. Empty clears it. */
export function cleanMeetUrl(value: string): { url: string } | { error: string } {
  const v = value.trim();
  if (!v) return { url: "" };
  const withScheme = /^[a-z]+:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:" || !u.hostname.includes(".")) throw new Error();
    return { url: u.toString() };
  } catch {
    return { error: "That doesn't look like a link. Copy it from Google Meet, e.g. https://meet.google.com/abc-defg-hij" };
  }
}
