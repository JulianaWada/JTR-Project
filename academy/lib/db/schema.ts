import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Money is always stored in kobo (1 naira = 100 kobo), the unit Paystack uses.
// Times are stored in UTC; classes are scheduled on Lagos time (see lib/time.ts).
// Row-Level Security is on for every table with no policies: the app connects as the database owner (which bypasses RLS),
// while Supabase's public API (anon and authenticated keys) gets no access at all. Keep .enableRLS() on any new table.

export type Role = "student" | "teacher";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").$type<Role>().notNull().default("student"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type CourseWeek = { week: number; title: string; summary: string };

/** "live": classes in the JTR class room in dated intakes. "recorded": video lessons students watch at their own pace. */
export type CourseFormat = "live" | "recorded";
/** How often a live course meets: one class a week, or one a day for a short intensive course. */
export type LessonUnit = "week" | "day";

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  /** Who the course is for, one item per line. */
  audience: text("audience").notNull().default(""),
  /** What students will be able to do, one item per line. */
  outcomes: text("outcomes").notNull().default(""),
  outline: jsonb("outline").$type<CourseWeek[]>().notNull().default([]),
  priceKobo: integer("price_kobo").notNull(),
  /** Optional price in US cents for students paying from abroad (Paystack USD). Null: naira only. */
  priceUsdCents: integer("price_usd_cents"),
  format: text("format").$type<CourseFormat>().notNull().default("live"),
  lessonUnit: text("lesson_unit").$type<LessonUnit>().notNull().default("week"),
  /** Share of classes a student must attend (live) or watch (recorded) to earn the certificate. */
  completionAttendancePercent: integer("completion_attendance_percent").notNull().default(80),
  /** Whether the final project must be passed to earn the certificate. */
  requiresFinalProject: boolean("requires_final_project").notNull().default(true),
  /** Accent used on course cards and certificates. */
  accent: text("accent").$type<"blue" | "violet">().notNull().default("blue"),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/** One intake of a course, e.g. "January 2027". Students enroll in a cohort, not a course. */
export const cohorts = pgTable(
  "cohorts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull().default(30),
    /** "jtr": classes happen in the JTR class room inside the academy. "link": they use meetUrl (Google Meet, Zoom…). */
    room: text("room").$type<"jtr" | "link">().notNull().default("jtr"),
    /** Outside meeting link for this cohort's classes, used when room is "link". */
    meetUrl: text("meet_url").notNull().default(""),
    enrolmentOpen: boolean("enrolment_open").notNull().default(true),
    /** The single always-open intake of a recorded course; its classes are video lessons. */
    selfPaced: boolean("self_paced").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cohorts_course_idx").on(t.courseId)],
).enableRLS();

export type Resource = { label: string; url: string };

/** A lesson's slide deck: the PowerPoint file, plus one image per slide for the slide viewer (empty when only the file is known). */
export type LessonSlides = { file: string; images: string[] };

/** A live class, or a video lesson in a self-paced intake. Notes and resources become the lesson page, and feed the AI tutor. */
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(90),
    /** Overrides the cohort's link for this class. */
    meetUrl: text("meet_url"),
    recordingUrl: text("recording_url"),
    notes: text("notes").notNull().default(""),
    resources: jsonb("resources").$type<Resource[]>().notNull().default([]),
    slides: jsonb("slides").$type<LessonSlides>(),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  },
  (t) => [index("classes_cohort_idx").on(t.cohortId, t.startsAt)],
).enableRLS();

export type EnrolmentStatus = "pending" | "active" | "cancelled";

export const enrolments = pgTable(
  "enrolments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    status: text("status").$type<EnrolmentStatus>().notNull().default("pending"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("enrolments_user_cohort_idx").on(t.userId, t.cohortId)],
).enableRLS();

/** "failed" also covers an unpaid attempt replaced by a newer one; "refunded" means the money went back and access was removed. */
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type Currency = "NGN" | "USD";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    enrolmentId: uuid("enrolment_id")
      .notNull()
      .references(() => enrolments.id, { onDelete: "cascade" }),
    /** In the payment's currency's smallest unit: kobo for NGN, cents for USD. */
    amountKobo: integer("amount_kobo").notNull(),
    listPriceKobo: integer("list_price_kobo").notNull(),
    currency: text("currency").$type<Currency>().notNull().default("NGN"),
    discountCode: text("discount_code"),
    status: text("status").$type<PaymentStatus>().notNull().default("pending"),
    /** "paystack" for real payments, "test" for the simulated checkout. */
    provider: text("provider").$type<"paystack" | "test">().notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_enrolment_idx").on(t.enrolmentId)],
).enableRLS();

export const discountCodes = pgTable("discount_codes", {
  code: text("code").primaryKey(),
  percentOff: integer("percent_off").notNull(),
  active: boolean("active").notNull().default(true),
  /** Empty means any course. */
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const attendance = pgTable(
  "attendance",
  {
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** "join" when the student clicked Join, "teacher" when Jules marked them present, "watched" when they finished a video lesson. */
    source: text("source").$type<"join" | "teacher" | "watched">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.classId, t.userId] })],
).enableRLS();

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    week: integer("week").notNull(),
    title: text("title").notNull(),
    brief: text("brief").notNull(),
    isFinalProject: boolean("is_final_project").notNull().default(false),
  },
  (t) => [index("assignments_course_idx").on(t.courseId)],
).enableRLS();

export type Grade = "pass" | "redo";

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    text: text("text").notNull().default(""),
    link: text("link"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    grade: text("grade").$type<Grade>(),
    feedback: text("feedback"),
    markedAt: timestamp("marked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("submissions_assignment_user_idx").on(t.assignmentId, t.userId)],
).enableRLS();

export type QuizQuestion = { question: string; options: string[]; answer: number };

export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  week: integer("week").notNull(),
  title: text("title").notNull(),
  questions: jsonb("questions").$type<QuizQuestion[]>().notNull(),
}).enableRLS();

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    answers: jsonb("answers").$type<number[]>().notNull(),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quiz_attempts_user_idx").on(t.userId, t.quizId)],
).enableRLS();

export const userBadges = pgTable(
  "user_badges",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    badge: text("badge").notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.cohortId, t.badge] })],
).enableRLS();

export const certificates = pgTable(
  "certificates",
  {
    /** The public verification code, e.g. JTR-7K3F9. */
    code: text("code").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    /** The name printed on the certificate, frozen at issue time. */
    studentName: text("student_name").notNull(),
    courseTitle: text("course_title").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("certificates_user_cohort_idx").on(t.userId, t.cohortId)],
).enableRLS();

export const tutorMessages = pgTable(
  "tutor_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    role: text("role").$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tutor_messages_thread_idx").on(t.userId, t.cohortId, t.createdAt)],
).enableRLS();

/**
 * The class chat: one group chat per intake, for its paid students and the teacher.
 * The teacher can pin and remove messages; students can remove their own.
 */
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_messages_cohort_idx").on(t.cohortId, t.createdAt)],
).enableRLS();

/** Every email the academy sends. In test mode this is the only place they go. */
export const emails = pgTable("emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  mode: text("mode").$type<"live" | "test">().notNull(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
