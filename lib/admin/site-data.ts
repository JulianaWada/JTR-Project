import "server-only";
import { count, desc, eq, gte } from "drizzle-orm";
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

export async function setLeadStatus(id: string, status: LeadStatus) {
  const db = await getDb();
  await db.update(schema.leads).set({ status }).where(eq(schema.leads.id, id));
}

export async function setInterestStatus(id: string, status: LeadStatus) {
  const db = await getDb();
  await db.update(schema.academyInterest).set({ status }).where(eq(schema.academyInterest.id, id));
}

export async function siteCounts() {
  const db = await getDb();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [[newLeads], [weekLeads], [newInterest], [allInterest]] = await Promise.all([
    db.select({ n: count() }).from(schema.leads).where(eq(schema.leads.status, "new")),
    db.select({ n: count() }).from(schema.leads).where(gte(schema.leads.createdAt, weekAgo)),
    db.select({ n: count() }).from(schema.academyInterest).where(eq(schema.academyInterest.status, "new")),
    db.select({ n: count() }).from(schema.academyInterest),
  ]);
  return { newLeads: newLeads.n, weekLeads: weekLeads.n, newInterest: newInterest.n, allInterest: allInterest.n };
}

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
  const [leadRows, interestRows] = await Promise.all([
    db.select({ at: schema.leads.createdAt }).from(schema.leads).where(gte(schema.leads.createdAt, since)),
    db.select({ at: schema.academyInterest.createdAt }).from(schema.academyInterest).where(gte(schema.academyInterest.createdAt, since)),
  ]);
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
