import "server-only";
import { and, count, desc, eq, gte, ilike, isNotNull, or, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// Website accounts (/account/signup) for the admin board's Members page and its CSV download.

export type MemberAudience = "all" | "email" | "whatsapp";

export function parseAudience(value: unknown): MemberAudience {
  return value === "email" || value === "whatsapp" ? value : "all";
}

function where(filter: { audience?: MemberAudience; q?: string; campaign?: string }) {
  const parts: SQL[] = [];
  if (filter.audience === "email") parts.push(eq(schema.members.marketingEmail, true));
  if (filter.audience === "whatsapp") parts.push(and(eq(schema.members.marketingWhatsapp, true), isNotNull(schema.members.phone))!);
  if (filter.campaign) parts.push(eq(schema.members.utmCampaign, filter.campaign));
  const q = filter.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    parts.push(or(ilike(schema.members.name, like), ilike(schema.members.email, like), ilike(schema.members.phone, like))!);
  }
  return parts.length ? and(...parts) : undefined;
}

const columns = {
  id: schema.members.id,
  name: schema.members.name,
  email: schema.members.email,
  phone: schema.members.phone,
  interests: schema.members.interests,
  locale: schema.members.locale,
  marketingEmail: schema.members.marketingEmail,
  marketingWhatsapp: schema.members.marketingWhatsapp,
  consentUpdatedAt: schema.members.consentUpdatedAt,
  utmSource: schema.members.utmSource,
  utmMedium: schema.members.utmMedium,
  utmCampaign: schema.members.utmCampaign,
  createdAt: schema.members.createdAt,
  lastLoginAt: schema.members.lastLoginAt,
};

export async function listMembers(filter: { audience?: MemberAudience; q?: string; campaign?: string; limit?: number } = {}) {
  const db = await getDb();
  return db
    .select(columns)
    .from(schema.members)
    .where(where(filter))
    .orderBy(desc(schema.members.createdAt))
    .limit(filter.limit ?? 500);
}

/** Every matching member with their unsubscribe token, for the CSV (used as the unsubscribe link in mail merges). */
export async function membersForExport(audience: MemberAudience) {
  const db = await getDb();
  return db
    .select({ ...columns, unsubscribeToken: schema.members.unsubscribeToken })
    .from(schema.members)
    .where(where({ audience }))
    .orderBy(desc(schema.members.createdAt));
}

export async function memberCounts() {
  const db = await getDb();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [[all], [week], [email], [whatsapp]] = await Promise.all([
    db.select({ n: count() }).from(schema.members),
    db.select({ n: count() }).from(schema.members).where(gte(schema.members.createdAt, weekAgo)),
    db.select({ n: count() }).from(schema.members).where(where({ audience: "email" })),
    db.select({ n: count() }).from(schema.members).where(where({ audience: "whatsapp" })),
  ]);
  return { all: all.n, week: week.n, email: email.n, whatsapp: whatsapp.n };
}

/** Sign-ups per campaign (utm_campaign), most first. */
export async function membersByCampaign() {
  const db = await getDb();
  const rows = await db
    .select({ campaign: schema.members.utmCampaign, source: schema.members.utmSource, n: count() })
    .from(schema.members)
    .where(or(isNotNull(schema.members.utmCampaign), isNotNull(schema.members.utmSource)))
    .groupBy(schema.members.utmCampaign, schema.members.utmSource)
    .orderBy(desc(count()))
    .limit(10);
  return rows;
}
