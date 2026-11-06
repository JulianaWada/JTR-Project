import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { checkCompletion } from "@/lib/certificates";
import { OPENS_MINUTES_BEFORE, outsideLink, usesJtrRoom } from "@/lib/class-room";
import { getDb, schema } from "@/lib/db";
import { addMinutes } from "@/lib/time";
import { asset } from "@/lib/assets";

/** The Join button: sends people into the JTR class room (or the intake's outside link), recording attendance for students. */
export async function GET(_request: Request, { params }: RouteContext<"/join/[classId]">) {
  const { classId } = await params;
  // A route handler's redirect doesn't add the /academy base path by itself (pages' redirects do), so add it here.
  const go: (path: string) => never = (path) => redirect(asset(path));
  if (!/^[0-9a-f-]{36}$/i.test(classId)) go("/learn");
  const user = await currentUser();
  if (!user) go(`/login?next=${encodeURIComponent(`/join/${classId}`)}`);
  const db = await getDb();
  const lesson = await db.query.classes.findFirst({ where: eq(schema.classes.id, classId) });
  if (!lesson) go("/learn");
  const cohort = (await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, lesson.cohortId) }))!;
  const room = `/learn/${cohort.id}/room`;
  const link = outsideLink(cohort, lesson);

  if (user.role === "teacher") {
    if (usesJtrRoom(cohort)) go(room);
    if (link) redirect(link);
    go(`/teach/cohorts/${cohort.id}`);
  }
  const enrolment = await db.query.enrolments.findFirst({
    where: and(eq(schema.enrolments.userId, user.id), eq(schema.enrolments.cohortId, cohort.id), eq(schema.enrolments.status, "active")),
  });
  if (!enrolment) go("/learn");

  const now = new Date();
  const opens = addMinutes(lesson.startsAt, -OPENS_MINUTES_BEFORE);
  const closes = addMinutes(lesson.startsAt, lesson.durationMinutes);
  if (now < opens || now > closes) go(`/learn/${cohort.id}/classes/${lesson.id}`);
  // The class room records attendance itself when the student comes in.
  if (usesJtrRoom(cohort)) go(room);
  if (!link) go(`/learn/${cohort.id}/classes/${lesson.id}`);

  await db.insert(schema.attendance).values({ classId, userId: user.id, source: "join" }).onConflictDoNothing();
  await checkCompletion(db, user.id, cohort.id);
  redirect(link);
}
