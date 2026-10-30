"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, safeNext, startSession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";

export type FormState = { error?: string } | undefined;

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const db = await getDb();
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "That email and password don't match." };
  }
  await startSession(user.id);
  redirect(safeNext(form.get("next"), user.role === "teacher" ? "/teach" : "/learn"));
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  email: z.email("Please enter a valid email address.").transform((e) => e.toLowerCase()),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(200),
});

export async function signup(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    name: form.get("name"),
    email: String(form.get("email") ?? "").trim(),
    phone: form.get("phone") || undefined,
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const db = await getDb();
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, parsed.data.email) });
  if (existing) return { error: "There's already an account with that email. Please log in instead." };
  const [user] = await db
    .insert(schema.users)
    .values({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, passwordHash: hashPassword(parsed.data.password) })
    .returning();
  await startSession(user.id);
  redirect(safeNext(form.get("next"), "/learn"));
}

export async function logout() {
  await endSession();
  redirect("/");
}
