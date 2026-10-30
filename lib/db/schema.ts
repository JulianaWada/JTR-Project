import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// The website's own data. Leads and Academy sign-ups are saved here as well as emailed,
// so nothing is lost if email is not set up yet. Times are stored in UTC.

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
);

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
);

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
});

export type LeadRow = typeof leads.$inferSelect;
export type AcademyInterestRow = typeof academyInterest.$inferSelect;
export type ProjectSettingsRow = typeof projectSettings.$inferSelect;
