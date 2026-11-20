import "server-only";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { cache } from "react";
import { getDb, schema } from "@/lib/db";
import type { LeadStatus } from "@/lib/db/schema";

// The website's own records (leads, Academy interest sign-ups, project settings) for the admin board.

export const leadStatuses: LeadStatus[] = ["new", "contacted", "done"];

export async function listLeads(filter: { status?: LeadStatus } = {}) {
  const db = await getDb();
  return db
    .select()
    .from(schema.leads)
    .where(filter.status ? eq(schema.leads.status, filter.status) : undefined)
    .orderBy(desc(schema.leads.createdAt))
    .limit(300);
}

export async function listInterest(filter: { status?: LeadStatus } = {}) {
  const db = await getDb();
  return db
    .select()
    .from(schema.academyInterest)
    .where(filter.status ? eq(schema.academyInterest.status, filter.status) : undefined)
    .orderBy(desc(schema.academyInterest.createdAt))
    .limit(500);
}

/** Returns the lead's name and old status (for the audit trail), or undefined when there is no such lead. */
export async function setLeadStatus(id: string, status: LeadStatus) {
  const db = await getDb();
  const [before] = await db.select({ name: schema.leads.name, status: schema.leads.status }).from(schema.leads).where(eq(schema.leads.id, id)).limit(1);
  if (!before) return undefined;
  await db.update(schema.leads).set({ status }).where(eq(schema.leads.id, id));
  return before;
}

export async function setInterestStatus(id: string, status: LeadStatus) {
  const db = await getDb();
  const [before] = await db
    .select({ name: schema.academyInterest.name, status: schema.academyInterest.status })
    .from(schema.academyInterest)
    .where(eq(schema.academyInterest.id, id))
    .limit(1);
  if (!before) return undefined;
  await db.update(schema.academyInterest).set({ status }).where(eq(schema.academyInterest.id, id));
  return before;
}

/**
 * Badge and headline counts in one query. Cached per request, so the board layout and the page share it.
 * One query instead of four parallel ones: many parallel queries on a few connections are pipelined by the
 * driver, and Supabase's transaction pooler could leave such a batch waiting (the overview timed out, Nov 2026).
 */
export const siteCounts = cache(async () => {
  const db = await getDb();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [row] = await db
    .select({
      newLeads: sql<number>`(select count(*)::int from ${schema.leads} where ${schema.leads.status} = 'new')`,
      weekLeads: sql<number>`(select count(*)::int from ${schema.leads} where ${schema.leads.createdAt} >= ${weekAgo.toISOString()}::timestamptz)`,
      newInterest: sql<number>`(select count(*)::int from ${schema.academyInterest} where ${schema.academyInterest.status} = 'new')`,
      allInterest: sql<number>`(select count(*)::int from ${schema.academyInterest})`,
    })
    .from(sql`(select 1) as one`);
  return {
    newLeads: Number(row?.newLeads ?? 0),
    weekLeads: Number(row?.weekLeads ?? 0),
    newInterest: Number(row?.newInterest ?? 0),
    allInterest: Number(row?.allInterest ?? 0),
  };
});

export async function interestByCourse() {
  const db = await getDb();
  const rows = await db
    .select({ course: schema.academyInterest.course, n: count() })
    .from(schema.academyInterest)
    .groupBy(schema.academyInterest.course);
  return Object.fromEntries(rows.map((r) => [r.course, r.n])) as Partial<Record<"sales" | "animation" | "both", number>>;
}

export type ProjectSettingsInput = {
  hidden: boolean;
  featured: boolean;
  status: "live" | "in-progress";
  href: string;
};

export async function saveProjectSettings(projectId: string, input: ProjectSettingsInput) {
  const db = await getDb();
  const values = { ...input, updatedAt: new Date() };
  await db
    .insert(schema.projectSettings)
    .values({ projectId, ...values })
    .onConflictDoUpdate({ target: schema.projectSettings.projectId, set: values });
}

/** Saves the display order: the project ids from first to last. */
export async function saveProjectOrder(ids: string[]) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    for (const [sortOrder, projectId] of ids.entries()) {
      await tx
        .insert(schema.projectSettings)
        .values({ projectId, sortOrder })
        .onConflictDoUpdate({ target: schema.projectSettings.projectId, set: { sortOrder, updatedAt: new Date() } });
    }
  });
}


export type DailyCount = { day: string; leads: number; signups: number };

/** Leads and Academy sign-ups per day (Lagos time) for the last `days` days, oldest first, including empty days. */
export async function dailyCounts(days = 14): Promise<DailyCount[]> {
  const db = await getDb();
  const since = new Date(Date.now() - days * 86_400_000);
  const dayOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(d);
  // One after the other, for the same reason as siteCounts.
  const leadRows = await db.select({ at: schema.leads.createdAt }).from(schema.leads).where(gte(schema.leads.createdAt, since));
  const interestRows = await db
    .select({ at: schema.academyInterest.createdAt })
    .from(schema.academyInterest)
    .where(gte(schema.academyInterest.createdAt, since));
  const result = new Map<string, DailyCount>();
  for (let i = days - 1; i >= 0; i--) {
    const day = dayOf(new Date(Date.now() - i * 86_400_000));
    result.set(day, { day, leads: 0, signups: 0 });
  }
  for (const r of leadRows) {
    const entry = result.get(dayOf(r.at));
    if (entry) entry.leads += 1;
  }
  for (const r of interestRows) {
    const entry = result.get(dayOf(r.at));
    if (entry) entry.signups += 1;
  }
  return [...result.values()];
}
