"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { schema } from "@/lib/db";
import { requireCohortAccess } from "@/lib/learn";
import { canReview, MAX_COMMENT, MAX_FEEDBACK } from "@/lib/reviews";

export type ReviewState = { error?: string; ok?: boolean } | undefined;

const input = z.object({
  rating: z.coerce.number().int().min(1, "Please choose from 1 to 5 stars.").max(5, "Please choose from 1 to 5 stars."),
  comment: z.string().trim().max(MAX_COMMENT, `Please keep your review under ${MAX_COMMENT} characters.`),
  feedback: z.string().trim().max(MAX_FEEDBACK, `Please keep your feedback under ${MAX_FEEDBACK} characters.`),
});

export async function saveReview(cohortId: string, _prev: ReviewState, form: FormData): Promise<ReviewState> {
  const { db, user, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/review`);
  if (user.role === "teacher") return { error: "Teachers can't review their own course." };
  if (!(await canReview(db, user.id, cohortId))) return { error: "You can rate this course once you reach the end of it." };
  const parsed = input.safeParse({
    rating: String(form.get("rating") ?? "0") || "0",
    comment: String(form.get("comment") ?? ""),
    feedback: String(form.get("feedback") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = await db.query.courseReviews.findFirst({
    where: and(eq(schema.courseReviews.userId, user.id), eq(schema.courseReviews.courseId, course.id)),
  });
  const values = { ...parsed.data, cohortId, updatedAt: new Date() };
  // Editing keeps a hidden review hidden: the teacher decides when it shows again.
  if (existing) await db.update(schema.courseReviews).set(values).where(eq(schema.courseReviews.id, existing.id));
  else await db.insert(schema.courseReviews).values({ ...values, courseId: course.id, userId: user.id });
  revalidatePath(`/learn/${cohortId}`, "layout");
  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/");
  return { ok: true };
}
