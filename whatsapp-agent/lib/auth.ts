import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env";

const COOKIE = "jtr_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function sign(payload: string) {
  return createHmac("sha256", env.sessionSecret).update(payload).digest("base64url");
}

export function createSessionToken(tenantId: string, now = Date.now()): string {
  const payload = `${tenantId}.${Math.floor(now / 1000) + MAX_AGE_SECONDS}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [tenantId, expiry, signature] = parts;
  const expected = Buffer.from(sign(`${tenantId}.${expiry}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  if (Number(expiry) * 1000 < now) return null;
  return tenantId;
}

export async function startSession(tenantId: string) {
  const store = await cookies();
  store.set(COOKIE, createSessionToken(tenantId), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in business, or a redirect to the login page. */
export async function requireTenant() {
  const tenantId = readSessionToken((await cookies()).get(COOKIE)?.value);
  if (!tenantId) redirect("/login");
  const db = await getDb();
  const tenant = await db.query.tenants.findFirst({ where: eq(schema.tenants.id, tenantId) });
  if (!tenant) redirect("/login");
  return tenant;
}
