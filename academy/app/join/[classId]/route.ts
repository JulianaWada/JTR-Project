import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { checkCompletion } from "@/lib/certificates";
import { getDb, schema } from "@/lib/db";
import { addMinutes } from "@/lib/time";

/** How early students can join, and how long after the start a join still counts as attendance. */
const OPENS_MINUTES_BEFORE = 30;

/** Records attendance, then sends the student on to Google Meet. */
export async function GET(_request: Request, { params }: RouteContext<"/join/[classId]">) {
  const { classId } = await params;
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/join/${classId}`)}`);
  const db = await getDb();
  const lesson = await db.query.classes.findFirst({ where: eq(schema.classes.id, classId) });
  if (!lesson) redirect("/learn");
  const cohort = (await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, lesson.cohortId) }))!;
  const meetUrl = lesson.meetUrl || cohort.meetUrl;

  if (user.role === "teacher") redirect(meetUrl || `/teach/cohorts/${cohort.id}`);
  const enrolment = await db.query.enrolments.findFirst({
    where: and(eq(schema.enrolments.userId, user.id), eq(schema.enrolments.cohortId, cohort.id), eq(schema.enrolments.status, "active")),
  });
  if (!enrolment) redirect("/learn");

  const now = new Date();
  const opens = addMinutes(lesson.startsAt, -OPENS_MINUTES_BEFORE);
  const closes = addMinutes(lesson.startsAt, lesson.durationMinutes);
  if (now < opens || now > closes || !meetUrl) redirect(`/learn/${cohort.id}/classes/${lesson.id}`);

  await db.insert(schema.attendance).values({ classId, userId: user.id, source: "join" }).onConflictDoNothing();
  await checkCompletion(db, user.id, cohort.id);
  redirect(meetUrl);
}
