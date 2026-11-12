import "server-only";
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { count, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb, schema } from "@/lib/db";
import type { AdminUserRow } from "@/lib/db/schema";
import { can, type Permission, type Role } from "./roles";

// Two kinds of login:
// - the super admin (Jules): ADMIN_EMAIL + ADMIN_PASSWORD from the environment. Outside production a demo password is
//   used when ADMIN_PASSWORD is not set. In production without ADMIN_PASSWORD the admin board stays closed for everyone.
// - team members, added by the super admin from Admin > Team, each with a role (see roles.ts) and their own password.

const COOKIE = "jtr_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;
export const DEMO_ADMIN_PASSWORD = "demo1234";

export function adminPassword(): string | undefined {
  const value = process.env.ADMIN_PASSWORD?.trim();
  if (value) return value;
  return process.env.NODE_ENV === "production" ? undefined : DEMO_ADMIN_PASSWORD;
}

/** When ADMIN_EMAIL is set, the super admin signs in with that email address (any letter case). */
export function adminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || undefined;
}

export function isDemoLogin() {
  return !process.env.ADMIN_PASSWORD?.trim();
}

export type AdminSession = {
  /** "owner" for the super admin, otherwise the team member's id. */
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  role: Role;
};

function ownerSession(): AdminSession {
  return { id: "owner", userId: null, name: process.env.ADMIN_NAME?.trim() || "Super admin", email: adminEmail() ?? null, role: "super_admin" };
}

function userSession(u: AdminUserRow): AdminSession {
  return { id: u.id, userId: u.id, name: u.name, email: u.email, role: u.role };
}

// ---------- Passwords ----------

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number }) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 32, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scrypt(password, Buffer.from(salt, "base64url"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return timingSafeEqual(actual, expected);
}

/** A password that is easy to read out or type: 4 groups of 4 letters and numbers, no look-alikes. */
export function generatePassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(16);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}

// A fixed hash, so an unknown email takes as long to reject as a wrong password.
let dummyHash: Promise<string> | null = null;

// ---------- Tokens ----------

/** Sessions are signed with a key derived from the super admin password, so changing it signs everyone out. */
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

/** Token: v2.<owner|user id>.<session version>.<expiry>.<signature> */
export function createAdminToken(subject: string, version: number, now = Date.now()): string | null {
  const password = adminPassword();
  if (!password) return null;
  const payload = `v2.${subject}.${version}.${Math.floor(now / 1000) + MAX_AGE_SECONDS}`;
  return `${payload}.${sign(payload, password)}`;
}

export function readAdminToken(token: string | undefined, now = Date.now()): { subject: string; version: number } | null {
  const password = adminPassword();
  if (!token || !password) return null;
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "v2") return null;
  const [, subject, version, expiry, signature] = parts;
  if (!safeEqual(signature, sign(`v2.${subject}.${version}.${expiry}`, password))) return null;
  if (Number(expiry) * 1000 <= now) return null;
  return { subject, version: Number(version) };
}

// ---------- Team members ----------

export async function findUserByEmail(email: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, email.trim().toLowerCase()))
    .limit(1);
  return row;
}

export async function teamSize() {
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(schema.adminUsers).where(eq(schema.adminUsers.active, true));
  return row?.n ?? 0;
}

// ---------- Sign in and out ----------

export type LoginResult = { ok: true; session: AdminSession; version: number } | { ok: false; reason: "wrong" | "disabled" | "closed" };

export async function checkLogin(attempt: { email: string; password: string }): Promise<LoginResult> {
  const ownerPassword = adminPassword();
  if (!ownerPassword) return { ok: false, reason: "closed" };
  const email = attempt.email.trim().toLowerCase();

  // A team member's email is checked against their own password only.
  const user = email ? await findUserByEmail(email) : undefined;
  if (user) {
    const passwordOk = await verifyPassword(attempt.password, user.passwordHash);
    if (!passwordOk) return { ok: false, reason: "wrong" };
    if (!user.active) return { ok: false, reason: "disabled" };
    const db = await getDb();
    await db.update(schema.adminUsers).set({ lastLoginAt: new Date() }).where(eq(schema.adminUsers.id, user.id));
    return { ok: true, session: userSession(user), version: user.sessionVersion };
  }

  const ownerEmail = adminEmail();
  // Both are always compared, so a wrong email takes as long to reject as a wrong password.
  const emailOk = ownerEmail ? safeEqual(email, ownerEmail) : true;
  const passwordOk = safeEqual(attempt.password, ownerPassword);
  if (emailOk && passwordOk) return { ok: true, session: ownerSession(), version: 1 };
  if (!passwordOk) {
    dummyHash ??= hashPassword("not-a-real-password");
    await verifyPassword(attempt.password, await dummyHash);
  }
  return { ok: false, reason: "wrong" };
}

export async function startAdminSession(subject: string, version: number) {
  const token = createAdminToken(subject, version);
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

/**
 * The person signed in, or null. Team members are looked up on every request, so a role change,
 * password reset or disable takes effect straight away.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const token = readAdminToken((await cookies()).get(COOKIE)?.value);
  if (!token) return null;
  if (token.subject === "owner") return ownerSession();
  if (!/^[0-9a-f-]{36}$/i.test(token.subject)) return null;
  const db = await getDb();
  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(sql`${schema.adminUsers.id} = ${token.subject} and ${schema.adminUsers.active} = true`)
    .limit(1);
  if (!user || user.sessionVersion !== token.version) return null;
  return userSession(user);
});

export async function isAdmin() {
  return Boolean(await getAdminSession());
}

/** Use at the top of every admin page and server action. Returns who is signed in. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export class PermissionError extends Error {
  constructor() {
    super("Your role doesn't allow this. Ask the super admin if you need it.");
  }
}

/** Signed in and allowed to do this. Throws for a role without the permission. */
export async function requirePermission(permission: Permission): Promise<AdminSession> {
  const session = await requireAdmin();
  if (!can(session.role, permission)) throw new PermissionError();
  return session;
}
