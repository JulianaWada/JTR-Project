import { count, eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import {
  assignments,
  attendance,
  certificates,
  classes,
  cohorts,
  courses,
  discountCodes,
  enrolments,
  payments,
  quizAttempts,
  quizzes,
  submissions,
  tutorMessages,
  userBadges,
  users,
} from "@/lib/db/schema";
import { courseTemplates, type CourseTemplate } from "@/lib/course-content";
import { env } from "@/lib/env";
import { koboFromNaira } from "@/lib/money";
import { hashPassword } from "@/lib/passwords";
import { ensureSelfPacedCohorts } from "@/lib/self-paced";
import { addDays, fromLagos, toLagosParts } from "@/lib/time";

export const TEACHER_EMAIL = "jules@julestechright.com";

/** 7pm Lagos time on the same weekday as `now`, `weeksFromNow` weeks away (can be negative). */
function classSlot(now: Date, weeksFromNow: number) {
  const { date } = toLagosParts(addDays(now, weeksFromNow * 7));
  return fromLagos(date, "19:00")!;
}

async function insertCourse(db: Database, t: CourseTemplate, sortOrder: number) {
  const [course] = await db
    .insert(courses)
    .values({
      slug: t.slug,
      title: t.title,
      tagline: t.tagline,
      description: t.description,
      audience: t.audience.join("\n"),
      outcomes: t.outcomes.join("\n"),
      outline: t.outline,
      priceKobo: koboFromNaira(t.priceNaira),
      format: t.format,
      // A recorded course is complete once every lesson is watched.
      completionAttendancePercent: t.format === "recorded" ? 100 : 80,
      accent: t.accent,
      sortOrder,
    })
    .returning();
  await db.insert(assignments).values(t.assignments.map((a) => ({ ...a, courseId: course.id })));
  await db.insert(quizzes).values(t.quizzes.map((q) => ({ ...q, courseId: course.id })));
  return course;
}

/** A cohort with one weekly class per lesson, the first `firstClassWeeksFromNow` weeks from now. */
async function insertCohort(
  db: Database,
  t: CourseTemplate,
  courseId: string,
  name: string,
  firstClassWeeksFromNow: number,
  now: Date,
  opts: { enrolmentOpen: boolean; withRecordings: boolean; meetUrl: string },
) {
  const startsAt = classSlot(now, firstClassWeeksFromNow);
  const [cohort] = await db
    .insert(cohorts)
    .values({ courseId, name, startsAt, meetUrl: opts.meetUrl, enrolmentOpen: opts.enrolmentOpen })
    .returning();
  const rows = await db
    .insert(classes)
    .values(
      t.lessons.map((l, i) => {
        const at = classSlot(now, firstClassWeeksFromNow + i);
        return {
          cohortId: cohort.id,
          week: l.week,
          title: l.title,
          startsAt: at,
          notes: l.notes,
          resources: l.resources,
          recordingUrl: opts.withRecordings && at < now ? "https://drive.google.com/file/d/demo-recording/view" : null,
        };
      }),
    )
    .returning();
  return { cohort, classes: rows };
}

/**
 * The two starter courses. Safe to run on a real database: it adds no people.
 * With `demo` it also adds sample intakes (one finished, with recordings), a sample Meet link and the EARLYBIRD code;
 * without it (production) Animation gets one upcoming intake with no Meet link, for Jules to fill in.
 */
export async function seedCourses(db: Database, { demo = false }: { demo?: boolean } = {}, now = new Date()) {
  const [sales, animation] = courseTemplates;
  const salesCourse = await insertCourse(db, sales, 0);
  const animationCourse = await insertCourse(db, animation, 1);

  // Sales is a recorded course with one self-paced intake. Animation is live, with an intake open for January.
  const [salesSelfPaced] = await ensureSelfPacedCohorts(db, now);
  const meetUrl = demo ? "https://meet.google.com/jtr-demo-class" : "";
  const animationDone = demo
    ? await insertCohort(db, animation, animationCourse.id, "September 2026", -8, now, { enrolmentOpen: false, withRecordings: true, meetUrl })
    : null;
  const animationNext = await insertCohort(db, animation, animationCourse.id, "January 2027", 11, now, { enrolmentOpen: true, withRecordings: false, meetUrl });

  if (demo) await db.insert(discountCodes).values({ code: "EARLYBIRD", percentOff: 20 });
  return { salesCourse, animationCourse, salesSelfPaced, animationDone, animationNext };
}

async function enrolPaid(db: Database, userId: string, cohortId: string, priceKobo: number, paidAt: Date) {
  const [enrolment] = await db
    .insert(enrolments)
    .values({ userId, cohortId, status: "active", enrolledAt: paidAt })
    .returning();
  await db.insert(payments).values({
    reference: `ACD-DEMO-${userId.slice(0, 6)}-${cohortId.slice(0, 6)}`.toUpperCase(),
    enrolmentId: enrolment.id,
    amountKobo: priceKobo,
    listPriceKobo: priceKobo,
    status: "success",
    provider: "test",
    paidAt,
  });
  return enrolment;
}

/** Demo students with some progress, so every screen has something to show. */
export async function seedDemoStudents(db: Database, password: string, seeded: Awaited<ReturnType<typeof seedCourses>>, now = new Date()) {
  const passwordHash = hashPassword(password);
  const [ada, tunde, chioma] = await db
    .insert(users)
    .values([
      { email: "ada@example.com", name: "Ada Okafor", phone: "+234 803 000 0001", passwordHash },
      { email: "tunde@example.com", name: "Tunde Bello", phone: "+234 803 000 0002", passwordHash },
      { email: "chioma@example.com", name: "Chioma Eze", phone: "+234 803 000 0003", passwordHash },
    ])
    .returning();

  const { salesCourse, animationCourse, salesSelfPaced: salesIntake } = seeded;
  const animationDone = seeded.animationDone;
  if (!animationDone) throw new Error("Demo students need the courses seeded with { demo: true }.");
  const salesAssignments = await db.query.assignments.findMany({ where: eq(assignments.courseId, salesCourse.id) });
  const animationAssignments = await db.query.assignments.findMany({ where: eq(assignments.courseId, animationCourse.id) });
  const salesQuizzes = await db.query.quizzes.findMany({ where: eq(quizzes.courseId, salesCourse.id) });

  // Ada and Tunde are taking the recorded sales course: Ada has watched three lessons, Tunde one.
  for (const student of [ada, tunde]) await enrolPaid(db, student.id, salesIntake.cohort.id, salesCourse.priceKobo, addDays(now, -25));
  const watched = salesIntake.classes.slice(0, 3);
  await db.insert(attendance).values([
    ...watched.map((c) => ({ classId: c.id, userId: ada.id, source: "watched" as const })),
    { classId: watched[0].id, userId: tunde.id, source: "watched" as const },
  ]);
  const week1Quiz = salesQuizzes.find((q) => q.week === 1)!;
  await db.insert(quizAttempts).values({ quizId: week1Quiz.id, userId: ada.id, answers: [1, 1, 0], score: 3, total: 3 });
  const profile = salesAssignments.find((a) => a.week === 2)!;
  const adverts = salesAssignments.find((a) => a.week === 3)!;
  await db.insert(submissions).values([
    {
      assignmentId: profile.id,
      userId: ada.id,
      cohortId: salesIntake.cohort.id,
      text: "My ideal customer is a working mum in Abuja, 28 to 40, who buys children's clothes online in the evening. Top questions: sizes, delivery time to Gwarinpa, whether I take transfers.",
      grade: "pass",
      feedback: "Great detail on when she buys. Use the evening timing in your adverts.",
      markedAt: addDays(now, -9),
      submittedAt: addDays(now, -11),
    },
    {
      assignmentId: adverts.id,
      userId: ada.id,
      cohortId: salesIntake.cohort.id,
      link: "https://docs.google.com/document/d/demo-adverts",
      text: "Five adverts for the school uniform bundle.",
      submittedAt: addDays(now, -2),
    },
  ]);
  await db.insert(userBadges).values([
    { userId: ada.id, cohortId: salesIntake.cohort.id, badge: "first-class" },
    { userId: ada.id, cohortId: salesIntake.cohort.id, badge: "first-assignment" },
    { userId: ada.id, cohortId: salesIntake.cohort.id, badge: "quiz-ace" },
    { userId: ada.id, cohortId: salesIntake.cohort.id, badge: "halfway" },
    { userId: tunde.id, cohortId: salesIntake.cohort.id, badge: "first-class" },
  ]);
  await db.insert(tutorMessages).values([
    { userId: ada.id, cohortId: salesIntake.cohort.id, role: "user", content: "How do I reply when a customer says my price is too high?", createdAt: addDays(now, -4) },
    {
      userId: ada.id,
      cohortId: salesIntake.cohort.id,
      role: "assistant",
      content:
        "Lead with value before you talk about price. From week 4: ask AI for three polite replies that explain what's included (quality, delivery, after-sales) without cutting the price. Offering a basic, standard and premium option (week 5) also helps the customer choose instead of haggling.",
      createdAt: addDays(now, -4),
    },
  ]);

  // Chioma finished the September animation intake and has her certificate.
  await enrolPaid(db, chioma.id, animationDone.cohort.id, animationCourse.priceKobo, addDays(now, -60));
  await db.insert(attendance).values(animationDone.classes.map((c) => ({ classId: c.id, userId: chioma.id, source: "join" as const })));
  await db.insert(submissions).values(
    animationAssignments.map((a) => ({
      assignmentId: a.id,
      userId: chioma.id,
      cohortId: animationDone.cohort.id,
      link: "https://drive.google.com/file/d/demo-video/view",
      grade: "pass" as const,
      feedback: a.isFinalProject ? "Lovely hook and clear call to action. Featured on JTR's Instagram." : "Well done.",
      markedAt: addDays(now, -14),
      submittedAt: addDays(now, -15),
    })),
  );
  await db.insert(userBadges).values(
    ["first-class", "first-assignment", "perfect-attendance", "final-project", "graduate"].map((badge) => ({
      userId: chioma.id,
      cohortId: animationDone.cohort.id,
      badge,
    })),
  );
  await db.insert(certificates).values({
    code: "JTR-DEMO7",
    userId: chioma.id,
    cohortId: animationDone.cohort.id,
    studentName: chioma.name,
    courseTitle: animationCourse.title,
    issuedAt: addDays(now, -14),
  });
}

/** First start: the starter courses and (outside production) demo students. */
export async function ensureDemoData(db: Database) {
  if (process.env.SKIP_DEMO_SEED === "true") return;
  const [{ value }] = await db.select({ value: count() }).from(courses);
  if (value > 0) return;

  const seeded = await seedCourses(db, { demo: Boolean(env.demoPassword) });
  if (env.demoPassword) await seedDemoStudents(db, env.demoPassword, seeded);
  console.info("[seed] Created the starter courses.");
}

/**
 * Makes sure Jules can log in as the teacher, on every start. The account is TEACHER_EMAIL (default jules@julestechright.com).
 * Missing: it is created with TEACHER_PASSWORD (or the demo password outside production).
 * Already there as a student (e.g. Jules signed up before TEACHER_PASSWORD was set): with TEACHER_PASSWORD set it becomes
 * the teacher and its password is reset to TEACHER_PASSWORD, so only the person who set the env var can log in to it.
 */
export async function ensureTeacherAccount(db: Database) {
  const email = process.env.TEACHER_EMAIL?.trim().toLowerCase() || TEACHER_EMAIL;
  const explicitPassword = process.env.TEACHER_PASSWORD?.trim();
  const password = explicitPassword || env.demoPassword;
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing?.role === "teacher") return;
  if (existing) {
    if (!explicitPassword) {
      console.warn(`[seed] ${email} is a student account. Set TEACHER_PASSWORD to make it the teacher.`);
      return;
    }
    await db.update(users).set({ role: "teacher", passwordHash: hashPassword(explicitPassword) }).where(eq(users.id, existing.id));
    console.info(`[seed] ${email} is now the teacher account.`);
    return;
  }
  if (!password) {
    console.warn("[seed] TEACHER_PASSWORD is not set, so no teacher account was created.");
    return;
  }
  await db.insert(users).values({ email, name: "Jules", role: "teacher", passwordHash: hashPassword(password) }).onConflictDoNothing();
}
