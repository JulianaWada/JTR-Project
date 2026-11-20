"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { alertNewSignup } from "@/lib/admin-alerts";
import { endSession, safeNext, startSession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { ensureTeacherAccount, TEACHER_EMAIL } from "@/lib/seed";

function isTeacherLogin(email: string, password: string) {
  const teacherPassword = process.env.TEACHER_PASSWORD?.trim();
  if (!teacherPassword) return false;
  const teacherEmail = process.env.TEACHER_EMAIL?.trim().toLowerCase() || TEACHER_EMAIL;
  const a = createHash("sha256").update(password.trim()).digest();
  const b = createHash("sha256").update(teacherPassword).digest();
  return email === teacherEmail && timingSafeEqual(a, b);
}

export type FormState = { error?: string; wrongPage?: "teacher" | "student"; email?: string } | undefined;

/** Checks the email and password; for the TEACHER_EMAIL account it also repairs the account from the env vars. */
async function checkLogin(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const db = await getDb();
  let user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if ((!user || !verifyPassword(password, user.passwordHash)) && isTeacherLogin(email, password)) {
    // The teacher typed TEACHER_EMAIL and TEACHER_PASSWORD: bring the account in line now, without waiting for a fresh start.
    await ensureTeacherAccount(db);
    user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  }
  if (!user || !verifyPassword(password, user.passwordHash)) return { db, user: null, email };
  return { db, user, email };
}

const NO_MATCH = "That email and password don't match.";

/** Student login. Teachers are pointed to the teacher login instead. */
export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const { user, email } = await checkLogin(form);
  if (!user) return { error: NO_MATCH, email };
  if (user.role === "teacher") {
    return { error: "This is the student login. Teachers sign in on the teacher login page.", wrongPage: "teacher", email };
  }
  await startSession(user.id);
  redirect(safeNext(form.get("next"), "/learn"));
}

/** Teacher login: approved teachers and the academy admin. Applicants go to their application; students are pointed back. */
export async function teacherLogin(_prev: FormState, form: FormData): Promise<FormState> {
  const { db, user, email } = await checkLogin(form);
  if (!user) return { error: NO_MATCH, email };
  if (user.role !== "teacher") {
    const applied = await db.query.teacherProfiles.findFirst({ where: eq(schema.teacherProfiles.userId, user.id), columns: { status: true } });
    if (!applied) {
      return { error: "This is the teacher login, and this account is a student account. Please use the student login.", wrongPage: "student", email };
    }
    // They applied to teach but aren't approved (yet): show them where their application stands.
    await startSession(user.id);
    redirect("/teach-with-us");
  }
  await startSession(user.id);
  const next = safeNext(form.get("next"), "/teach");
  redirect(next.startsWith("/teach") || next.startsWith("/learn") || next.startsWith("/join") ? next : "/teach");
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
  await alertNewSignup(db, user);
  await startSession(user.id);
  redirect(safeNext(form.get("next"), "/learn"));
}

export async function logout() {
  await endSession();
  redirect("/");
}
