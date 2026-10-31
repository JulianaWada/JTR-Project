import { and, eq, gt, inArray, isNull, lte } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { classes, cohorts, courses, enrolments, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { url } from "@/lib/env";
import { formatDateTime } from "@/lib/time";

/** Emails every enrolled student about classes starting in the next 24 hours. Run hourly. */
export async function sendClassReminders(db: Database, now = new Date()) {
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const due = await db.query.classes.findMany({
    where: and(isNull(classes.reminderSentAt), gt(classes.startsAt, now), lte(classes.startsAt, soon)),
  });
  let sent = 0;
  for (const lesson of due) {
    // Claim the class first so two overlapping runs don't both send.
    const claimed = await db
      .update(classes)
      .set({ reminderSentAt: now })
      .where(and(eq(classes.id, lesson.id), isNull(classes.reminderSentAt)))
      .returning();
    if (!claimed.length) continue;
    const cohort = (await db.query.cohorts.findFirst({ where: eq(cohorts.id, lesson.cohortId) }))!;
    const course = (await db.query.courses.findFirst({ where: eq(courses.id, cohort.courseId) }))!;
    const active = await db.query.enrolments.findMany({
      where: and(eq(enrolments.cohortId, cohort.id), eq(enrolments.status, "active")),
    });
    if (!active.length) continue;
    const students = await db.query.users.findMany({ where: inArray(users.id, active.map((e) => e.userId)) });
    for (const student of students) {
      await sendEmail(db, {
        to: student.email,
        subject: `Class reminder: ${lesson.title}`,
        body: [
          `Hi ${student.name},`,
          "",
          `Your ${course.title} class "${lesson.title}" (week ${lesson.week}) starts ${formatDateTime(lesson.startsAt)} Lagos time.`,
          `Join from your dashboard so your attendance is recorded: ${url(`/learn/${cohort.id}/classes/${lesson.id}`)}`,
          "",
          "See you there,",
          "Jules",
        ].join("\n"),
      });
      sent++;
    }
  }
  return { classes: due.length, emails: sent };
}
