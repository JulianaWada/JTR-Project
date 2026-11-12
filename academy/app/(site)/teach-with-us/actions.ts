"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUser, startSession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { applyAsTeacher, cleanApplication } from "@/lib/teacher-applications";

export type ApplyState = { error?: string } | undefined;

const accountSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: z.email("Please enter a valid email address.").transform((e) => e.toLowerCase()),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(200),
});

/** Registers a teacher: a new account (or the signed-in one) plus an application the admin approves. */
export async function applyToTeach(_prev: ApplyState, form: FormData): Promise<ApplyState> {
  const app = cleanApplication(form);
  if ("error" in app) return app;
  const db = await getDb();
  let user = await currentUser();
  if (!user) {
    const parsed = accountSchema.safeParse({
      name: form.get("name"),
      email: String(form.get("email") ?? "").trim(),
      phone: form.get("phone") || undefined,
      password: form.get("password"),
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    if (await db.query.users.findFirst({ where: eq(schema.users.email, parsed.data.email) })) {
      return { error: "There's already an account with that email. Log in first, then come back to this page to apply." };
    }
    [user] = await db
      .insert(schema.users)
      .values({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, passwordHash: hashPassword(parsed.data.password) })
      .returning();
    await startSession(user.id);
  }
  const result = await applyAsTeacher(db, user.id, app);
  if ("error" in result) return { error: result.error };
  redirect("/teach-with-us?sent=1");
}
