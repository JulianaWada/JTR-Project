"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import type { ReviewStatus } from "@/lib/db/schema";
import { canManageCourse } from "@/lib/teachers";

/** Hide a review from the course page, or show it again. Only the course's teacher or the admin. */
export async function setReviewStatus(reviewId: string, status: ReviewStatus, back: string) {
  const user = await requireTeacher();
  const db = await getDb();
  const review = await db.query.courseReviews.findFirst({ where: eq(schema.courseReviews.id, reviewId) });
  const safeBack = back.startsWith("/teach/reviews") ? back : "/teach/reviews";
  const join = safeBack.includes("?") ? "&" : "?";
  if (!review || !(await canManageCourse(db, user, review.courseId))) redirect(`${safeBack}${join}error=${encodeURIComponent("That review isn't on one of your courses.")}`);
  await db.update(schema.courseReviews).set({ status: status === "hidden" ? "hidden" : "published" }).where(eq(schema.courseReviews.id, reviewId));
  const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, review.courseId), columns: { slug: true } });
  if (course) revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/");
  revalidatePath("/teach/reviews");
  redirect(`${safeBack}${join}saved=${encodeURIComponent(status === "hidden" ? "Review hidden from the course page" : "Review shown on the course page")}`);
}
