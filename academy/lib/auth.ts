import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { BASE_PATH, env } from "@/lib/env";

const COOKIE = "jtr_academy_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sign(payload: string) {
  return createHmac("sha256", env.sessionSecret).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, now = Date.now()): string {
  const payload = `${userId}.${Math.floor(now / 1000) + MAX_AGE_SECONDS}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiry, signature] = parts;
  const expected = Buffer.from(sign(`${userId}.${expiry}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  if (Number(expiry) * 1000 < now) return null;
  return userId;
}

export async function startSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    // Scoped to the academy so it is never sent to the rest of the website.
    path: BASE_PATH,
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: BASE_PATH });
}

/** The signed-in person, or null. */
export async function currentUser() {
  const userId = readSessionToken((await cookies()).get(COOKIE)?.value);
  if (!userId) return null;
  const db = await getDb();
  return (await db.query.users.findFirst({ where: eq(schema.users.id, userId) })) ?? null;
}

/** The signed-in person, or a redirect to the login page that comes back to `next`. */
export async function requireUser(next = "/learn") {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireTeacher() {
  const user = await requireUser("/teach");
  if (user.role !== "teacher") redirect("/learn");
  return user;
}

/** Only allow redirects back into the academy. */
export function safeNext(value: unknown, fallback: string) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
