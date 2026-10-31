"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkCompletion } from "@/lib/certificates";
import { schema } from "@/lib/db";
import { requireCohortAccess } from "@/lib/learn";

/** Marks a video lesson of a recorded course as watched (or not), which counts towards the certificate. */
export async function setLessonWatched(cohortId: string, classId: string, watched: boolean) {
  const path = `/learn/${cohortId}/classes/${classId}`;
  const { db, user, cohort } = await requireCohortAccess(cohortId, path);
  if (user.role === "teacher" || !cohort.selfPaced) redirect(path);
  const lesson = await db.query.classes.findFirst({ where: and(eq(schema.classes.id, classId), eq(schema.classes.cohortId, cohortId)) });
  if (!lesson) redirect(`/learn/${cohortId}`);
  if (watched) await db.insert(schema.attendance).values({ classId, userId: user.id, source: "watched" }).onConflictDoNothing();
  else await db.delete(schema.attendance).where(and(eq(schema.attendance.classId, classId), eq(schema.attendance.userId, user.id)));
  await checkCompletion(db, user.id, cohortId);
  revalidatePath(`/learn/${cohortId}`, "layout");
  redirect(path);
}
