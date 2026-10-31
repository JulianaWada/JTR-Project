"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkCompletion } from "@/lib/certificates";
import { schema } from "@/lib/db";
import { requireCohortAccess } from "@/lib/learn";

const input = z.object({
  text: z.string().trim().max(10000),
  link: z.union([z.literal(""), z.url("Please paste a full link starting with https://")]),
});

export async function submitAssignment(cohortId: string, assignmentId: string, _prev: { error?: string; ok?: boolean } | undefined, form: FormData) {
  const { db, user, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/assignments/${assignmentId}`);
  if (user.role === "teacher") return { error: "Teachers can't hand in work." };
  const assignment = await db.query.assignments.findFirst({
    where: and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.courseId, course.id)),
  });
  if (!assignment) return { error: "Assignment not found." };
  const parsed = input.safeParse({ text: String(form.get("text") ?? ""), link: String(form.get("link") ?? "").trim() });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!parsed.data.text && !parsed.data.link) return { error: "Write your answer or paste a link to your work." };

  const existing = await db.query.submissions.findFirst({
    where: and(eq(schema.submissions.assignmentId, assignmentId), eq(schema.submissions.userId, user.id)),
  });
  if (existing?.grade === "pass") return { error: "This assignment has already passed." };
  const values = { text: parsed.data.text, link: parsed.data.link || null, submittedAt: new Date(), grade: null, feedback: null, markedAt: null };
  if (existing) await db.update(schema.submissions).set(values).where(eq(schema.submissions.id, existing.id));
  else await db.insert(schema.submissions).values({ ...values, assignmentId, userId: user.id, cohortId });
  await checkCompletion(db, user.id, cohortId);
  revalidatePath(`/learn/${cohortId}`, "layout");
  return { ok: true };
}
