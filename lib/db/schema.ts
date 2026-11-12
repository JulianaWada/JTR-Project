import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// The website's own data. Leads and Academy sign-ups are saved here as well as emailed,
// so nothing is lost if email is not set up yet. Times are stored in UTC.
// Row-Level Security is on for every table with no policies: the site connects as the database owner (which bypasses RLS),
// while Supabase's public API (anon and authenticated keys) gets no access. Keep .enableRLS() on any new table.

export type LeadStatus = "new" | "contacted" | "done";

/** Contact-form and AI-assistant enquiries. */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: text("source").$type<"contact-form" | "assistant">().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    country: text("country"),
    timezone: text("timezone"),
    service: text("service"),
    budget: text("budget"),
    currency: text("currency"),
    message: text("message").notNull(),
    locale: text("locale").notNull(),
    status: text("status").$type<LeadStatus>().notNull().default("new"),
    /** False when the notification email could not be sent. */
    emailed: boolean("emailed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_created_idx").on(t.createdAt)],
).enableRLS();

/** JTR Academy register-interest form (/academy/interest). */
export const academyInterest = pgTable(
  "academy_interest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    course: text("course").$type<"sales" | "animation" | "both">().notNull(),
    location: text("location"),
    heardFrom: text("heard_from"),
    locale: text("locale").notNull(),
    consent: boolean("consent").notNull().default(false),
    status: text("status").$type<LeadStatus>().notNull().default("new"),
    emailed: boolean("emailed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("academy_interest_created_idx").on(t.createdAt)],
).enableRLS();

/**
 * Admin changes to the portfolio in content/site.ts, by project id. A missing row or a null field
 * means "as in the code". Titles and summaries stay in messages/*.json, in all four languages.
 */
export const projectSettings = pgTable("project_settings", {
  projectId: text("project_id").primaryKey(),
  hidden: boolean("hidden").notNull().default(false),
  featured: boolean("featured"),
  status: text("status").$type<"live" | "in-progress">(),
  href: text("href"),
  sortOrder: integer("sort_order"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * Admin board roles. The super admin is the ADMIN_EMAIL / ADMIN_PASSWORD login from the environment (Jules) and is
 * never stored here, so it can't be locked out. Team members added from Admin > Team get one of these roles.
 */
export type AdminRole = "admin" | "staff" | "viewer";

/** Team members who can sign in to the admin board. Passwords are stored as scrypt hashes, never in plain text. */
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").$type<AdminRole>().notNull(),
  passwordHash: text("password_hash").notNull(),
  active: boolean("active").notNull().default(true),
  /** Goes up on a password reset, role change or disable, which signs that person out everywhere. */
  sessionVersion: integer("session_version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
}).enableRLS();

/** Who did what on the admin board, and when. Rows are only ever added, never changed. */
export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    /** Null for the super admin (who has no row in admin_users) and for failed sign-ins. */
    actorId: uuid("actor_id"),
    actorName: text("actor_name").notNull(),
    actorEmail: text("actor_email"),
    actorRole: text("actor_role").notNull(),
    action: text("action").notNull(),
    /** A short, human description of what was changed, e.g. a lead's name or a project id. */
    target: text("target"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ip: text("ip"),
  },
  (t) => [index("admin_audit_log_at_idx").on(t.at), index("admin_audit_log_action_idx").on(t.action)],
).enableRLS();

export type AdminUserRow = typeof adminUsers.$inferSelect;
export type AdminAuditRow = typeof adminAuditLog.$inferSelect;
export type LeadRow = typeof leads.$inferSelect;
export type AcademyInterestRow = typeof academyInterest.$inferSelect;
export type ProjectSettingsRow = typeof projectSettings.$inferSelect;
