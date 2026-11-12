import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { AdminRole } from "@/lib/db/schema";
import { hashPassword } from "./auth";

// Team members of the admin board (Admin > Team). Only the super admin manages them.

export async function listTeam() {
  const db = await getDb();
  return db.select().from(schema.adminUsers).orderBy(asc(schema.adminUsers.createdAt));
}

export async function getTeamMember(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).limit(1);
  return row;
}

export async function addTeamMember(input: { name: string; email: string; role: AdminRole; password: string }) {
  const db = await getDb();
  const [row] = await db
    .insert(schema.adminUsers)
    .values({ name: input.name, email: input.email.toLowerCase(), role: input.role, passwordHash: await hashPassword(input.password) })
    .onConflictDoNothing({ target: schema.adminUsers.email })
    .returning();
  return row;
}

/** Every change here bumps the session version, so the person is signed out and signs in again with the new settings. */
export async function updateTeamMember(id: string, change: { role?: AdminRole; active?: boolean; password?: string }) {
  const db = await getDb();
  await db
    .update(schema.adminUsers)
    .set({
      ...(change.role ? { role: change.role } : {}),
      ...(change.active === undefined ? {} : { active: change.active }),
      ...(change.password ? { passwordHash: await hashPassword(change.password) } : {}),
      sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1`,
    })
    .where(eq(schema.adminUsers.id, id));
}

/** A team member's own password change. Returns the new session version so they stay signed in. */
export async function changeOwnPassword(id: string, password: string) {
  const db = await getDb();
  const [row] = await db
    .update(schema.adminUsers)
    .set({ passwordHash: await hashPassword(password), sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` })
    .where(eq(schema.adminUsers.id, id))
    .returning({ version: schema.adminUsers.sessionVersion });
  return row?.version;
}
