import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { hashPassword, verifyPassword } from "@/lib/admin/auth";
import { getDb, schema } from "@/lib/db";
import type { MemberRow } from "@/lib/db/schema";

// Website accounts. A session is a random token in an httpOnly cookie; only its SHA-256 hash is stored, so a copy
// of the database can't be used to sign in. No secret environment variable is needed.

const COOKIE = "jtr_member";
/** Readable by the page (no secret in it), so the header can show "My account" without making pages dynamic. */
export const SIGNED_IN_HINT_COOKIE = "jtr_member_in";
const SESSION_DAYS = 30;
const RESET_MINUTES = 60;

export type Member = Pick<
  MemberRow,
  "id" | "email" | "name" | "phone" | "interests" | "locale" | "marketingEmail" | "marketingWhatsapp" | "consentUpdatedAt" | "createdAt"
>;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function newToken() {
  return randomBytes(32).toString("base64url");
}

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    interests: row.interests,
    locale: row.locale,
    marketingEmail: row.marketingEmail,
    marketingWhatsapp: row.marketingWhatsapp,
    consentUpdatedAt: row.consentUpdatedAt,
    createdAt: row.createdAt,
  };
}

export async function findMemberByEmail(email: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.members).where(eq(schema.members.email, email.trim().toLowerCase())).limit(1);
  return row;
}

export type NewMember = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  interests: string[];
  locale: string;
  marketingEmail: boolean;
  marketingWhatsapp: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

/** Creates the account, or returns null when the email is already registered. */
export async function createMember(input: NewMember): Promise<MemberRow | null> {
  const db = await getDb();
  const consent = input.marketingEmail || input.marketingWhatsapp;
  const [row] = await db
    .insert(schema.members)
    .values({
      name: input.name,
      email: input.email.trim().toLowerCase(),
      passwordHash: await hashPassword(input.password),
      phone: input.phone ?? null,
      interests: input.interests,
      locale: input.locale,
      marketingEmail: input.marketingEmail,
      marketingWhatsapp: input.marketingWhatsapp,
      consentUpdatedAt: consent ? new Date() : null,
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      unsubscribeToken: newToken(),
    })
    .onConflictDoNothing({ target: schema.members.email })
    .returning();
  return row ?? null;
}

// A fixed hash, so an unknown email takes as long to reject as a wrong password.
let dummyHash: Promise<string> | null = null;

export async function checkMemberLogin(email: string, password: string): Promise<MemberRow | null> {
  const row = await findMemberByEmail(email);
  if (!row) {
    dummyHash ??= hashPassword("not-a-real-password");
    await verifyPassword(password, await dummyHash);
    return null;
  }
  if (!(await verifyPassword(password, row.passwordHash))) return null;
  const db = await getDb();
  await db.update(schema.members).set({ lastLoginAt: new Date() }).where(eq(schema.members.id, row.id));
  return row;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 86_400,
};

export async function startMemberSession(memberId: string) {
  const token = newToken();
  const db = await getDb();
  await db.insert(schema.memberSessions).values({
    tokenHash: sha256(token),
    memberId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
  });
  // Tidy up this person's expired sessions now and then.
  await db.delete(schema.memberSessions).where(and(eq(schema.memberSessions.memberId, memberId), lt(schema.memberSessions.expiresAt, new Date())));
  const jar = await cookies();
  jar.set(COOKIE, token, cookieOptions);
  jar.set(SIGNED_IN_HINT_COOKIE, "1", { ...cookieOptions, httpOnly: false });
}

export async function endMemberSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(schema.memberSessions).where(eq(schema.memberSessions.tokenHash, sha256(token)));
  }
  jar.delete({ name: COOKIE, path: "/" });
  jar.delete({ name: SIGNED_IN_HINT_COOKIE, path: "/" });
}

/** The signed-in member, or null. */
export const getMember = cache(async (): Promise<Member | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const [row] = await db
    .select({ member: schema.members })
    .from(schema.memberSessions)
    .innerJoin(schema.members, eq(schema.members.id, schema.memberSessions.memberId))
    .where(and(eq(schema.memberSessions.tokenHash, sha256(token)), gt(schema.memberSessions.expiresAt, new Date())))
    .limit(1);
  return row ? toMember(row.member) : null;
});

export type ProfileUpdate = Pick<Member, "name" | "phone" | "interests" | "marketingEmail" | "marketingWhatsapp">;

export async function updateMember(id: string, update: ProfileUpdate) {
  const db = await getDb();
  const [before] = await db
    .select({ marketingEmail: schema.members.marketingEmail, marketingWhatsapp: schema.members.marketingWhatsapp })
    .from(schema.members)
    .where(eq(schema.members.id, id))
    .limit(1);
  if (!before) return;
  const consentChanged = before.marketingEmail !== update.marketingEmail || before.marketingWhatsapp !== update.marketingWhatsapp;
  await db
    .update(schema.members)
    .set({ ...update, ...(consentChanged ? { consentUpdatedAt: new Date() } : {}) })
    .where(eq(schema.members.id, id));
}

/** Deletes the account and everything linked to it (sessions and reset links go with it). */
export async function deleteMember(id: string) {
  const db = await getDb();
  await db.delete(schema.members).where(eq(schema.members.id, id));
}

// ---------- Forgot password ----------

/** Returns a one-time token for the reset link, or null when no account has this email. */
export async function createPasswordReset(email: string): Promise<{ token: string; member: MemberRow } | null> {
  const member = await findMemberByEmail(email);
  if (!member) return null;
  const token = newToken();
  const db = await getDb();
  await db.insert(schema.memberPasswordResets).values({
    tokenHash: sha256(token),
    memberId: member.id,
    expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000),
  });
  return { token, member };
}

/** Sets the new password and signs the person out everywhere. Returns their id, or null when the link is wrong, used or expired. */
export async function resetPassword(token: string, password: string): Promise<string | null> {
  const db = await getDb();
  const [reset] = await db
    .select()
    .from(schema.memberPasswordResets)
    .where(
      and(
        eq(schema.memberPasswordResets.tokenHash, sha256(token)),
        isNull(schema.memberPasswordResets.usedAt),
        gt(schema.memberPasswordResets.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!reset) return null;
  await db.update(schema.memberPasswordResets).set({ usedAt: new Date() }).where(eq(schema.memberPasswordResets.tokenHash, reset.tokenHash));
  await db.update(schema.members).set({ passwordHash: await hashPassword(password) }).where(eq(schema.members.id, reset.memberId));
  await db.delete(schema.memberSessions).where(eq(schema.memberSessions.memberId, reset.memberId));
  return reset.memberId;
}

// ---------- Unsubscribe ----------

export async function findByUnsubscribeToken(token: string) {
  if (!token || token.length > 200) return undefined;
  const db = await getDb();
  const [row] = await db
    .select({ id: schema.members.id, email: schema.members.email, marketingEmail: schema.members.marketingEmail })
    .from(schema.members)
    .where(eq(schema.members.unsubscribeToken, token))
    .limit(1);
  return row;
}

export async function unsubscribeEmail(token: string) {
  const row = await findByUnsubscribeToken(token);
  if (!row) return false;
  if (row.marketingEmail) {
    const db = await getDb();
    await db.update(schema.members).set({ marketingEmail: false, consentUpdatedAt: new Date() }).where(eq(schema.members.id, row.id));
  }
  return true;
}
