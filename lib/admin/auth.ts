import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// One login, for Jules. The password is ADMIN_PASSWORD; outside production a demo password is used
// when it is not set. In production without ADMIN_PASSWORD the admin board stays closed.

const COOKIE = "jtr_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;
export const DEMO_ADMIN_PASSWORD = "demo1234";

export function adminPassword(): string | undefined {
  const value = process.env.ADMIN_PASSWORD?.trim();
  if (value) return value;
  return process.env.NODE_ENV === "production" ? undefined : DEMO_ADMIN_PASSWORD;
}

/** When ADMIN_EMAIL is set, the login also asks for that email address (any letter case). */
export function adminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || undefined;
}

export function isDemoLogin() {
  return !process.env.ADMIN_PASSWORD?.trim();
}

/** Sessions are signed with a key derived from the password, so changing the password signs everyone out. */
function key(password: string) {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
  return createHash("sha256").update(`jtr-admin:${secret}:${password}`).digest();
}

function sign(payload: string, password: string) {
  return createHmac("sha256", key(password)).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export function checkLogin(attempt: { email: string; password: string }): boolean {
  const password = adminPassword();
  if (!password) return false;
  const email = adminEmail();
  // Both are always compared, so a wrong email takes as long to reject as a wrong password.
  const emailOk = email ? safeEqual(attempt.email.trim().toLowerCase(), email) : true;
  const passwordOk = safeEqual(attempt.password, password);
  return emailOk && passwordOk;
}

export function createAdminToken(now = Date.now()): string | null {
  const password = adminPassword();
  if (!password) return null;
  const payload = `admin.${Math.floor(now / 1000) + MAX_AGE_SECONDS}`;
  return `${payload}.${sign(payload, password)}`;
}

export function verifyAdminToken(token: string | undefined, now = Date.now()): boolean {
  const password = adminPassword();
  if (!token || !password) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const [, expiry, signature] = parts;
  if (!safeEqual(signature, sign(`admin.${expiry}`, password))) return false;
  return Number(expiry) * 1000 > now;
}

export async function startAdminSession() {
  const token = createAdminToken();
  if (!token) return;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endAdminSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function isAdmin() {
  return verifyAdminToken((await cookies()).get(COOKIE)?.value);
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
