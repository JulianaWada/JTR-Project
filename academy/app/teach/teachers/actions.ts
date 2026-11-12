"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { reviewTeacher, type Review } from "@/lib/teacher-applications";

/** Admin only: approve, decline or suspend a teacher. */
export async function review(userId: string, decision: Review, form: FormData) {
  await requireAdmin();
  const result = await reviewTeacher(await getDb(), userId, decision, String(form.get("note") ?? ""));
  revalidatePath("/teach", "layout");
  const done = { approve: "Approved. They can now open their teacher dashboard.", reject: "Application declined.", suspend: "Teacher suspended." }[decision];
  const qs = "error" in result ? `error=${encodeURIComponent(result.error ?? "")}` : `saved=${encodeURIComponent(done)}`;
  redirect(`/teach/teachers?${qs}`);
}
