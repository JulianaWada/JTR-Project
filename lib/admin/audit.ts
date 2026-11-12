import "server-only";
import { and, count, desc, eq, gte, type SQL } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb, schema } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import type { AdminSession } from "./auth";

// The audit trail: one row for each sign-in and each change made on the admin board.
// Rows are only ever inserted. A failed write is logged but never stops the change itself.

export const auditActions = {
  "login.success": "Signed in",
  "login.failed": "Failed sign-in",
  logout: "Signed out",
  "lead.status": "Changed a lead's status",
  "interest.status": "Changed an academy sign-up's status",
  "project.update": "Edited a project",
  "project.move": "Moved a project",
  "whatsapp.business_added": "Added a WhatsApp business",
  "export.download": "Downloaded a CSV",
  "team.added": "Added a team member",
  "team.role": "Changed a role",
  "team.disabled": "Turned off a login",
  "team.enabled": "Turned a login back on",
  "team.password_reset": "Reset a password",
  "account.password": "Changed own password",
  "permission.denied": "Tried something their role doesn't allow",
} as const;

export type AuditAction = keyof typeof auditActions;

type Actor = Pick<AdminSession, "userId" | "name" | "email"> & { role: AdminSession["role"] | "unknown" };

export async function recordAudit(actor: Actor, action: AuditAction, target?: string | null, details?: Record<string, unknown>) {
  try {
    const db = await getDb();
    await db.insert(schema.adminAuditLog).values({
      actorId: actor.userId,
      actorName: actor.name,
      actorEmail: actor.email,
      actorRole: actor.role,
      action,
      target: target ?? null,
      details: details ?? null,
      ip: clientIp(await headers()),
    });
  } catch (err) {
    console.error("[admin] audit trail write failed", action, err);
  }
}

export type AuditFilter = { action?: string; actor?: string; days?: number; page?: number };
export const AUDIT_PAGE_SIZE = 50;

export async function listAudit(filter: AuditFilter = {}) {
  const db = await getDb();
  const where: SQL[] = [];
  if (filter.action && filter.action in auditActions) where.push(eq(schema.adminAuditLog.action, filter.action));
  if (filter.actor) where.push(eq(schema.adminAuditLog.actorName, filter.actor));
  if (filter.days) where.push(gte(schema.adminAuditLog.at, new Date(Date.now() - filter.days * 86_400_000)));
  const condition = where.length ? and(...where) : undefined;
  const page = Math.max(1, filter.page ?? 1);
  const [rows, [total]] = await Promise.all([
    db
      .select()
      .from(schema.adminAuditLog)
      .where(condition)
      .orderBy(desc(schema.adminAuditLog.at))
      .limit(AUDIT_PAGE_SIZE)
      .offset((page - 1) * AUDIT_PAGE_SIZE),
    db.select({ n: count() }).from(schema.adminAuditLog).where(condition),
  ]);
  return { rows, total: total?.n ?? 0, page };
}

/** Names that appear in the trail, for the "who" filter. */
export async function auditActors() {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ name: schema.adminAuditLog.actorName })
    .from(schema.adminAuditLog)
    .orderBy(schema.adminAuditLog.actorName)
    .limit(200);
  return rows.map((r) => r.name);
}
