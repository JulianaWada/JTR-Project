import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, readSessionToken } from "@/lib/auth";
import { openCohorts } from "@/lib/catalog";
import { checkCompletion } from "@/lib/certificates";
import { createInMemoryDb, type Database } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { markPaymentRefunded, markPaymentSuccessful, priceFor, startCheckout } from "@/lib/enrolment";
import { classState } from "@/lib/learn";
import { getProgress } from "@/lib/progress";
import { parseQuiz, quizToText } from "@/lib/quiz-format";
import { sendClassReminders } from "@/lib/reminders";
import { existsSync, readFileSync } from "node:fs";
import { currencyFor, localPrice } from "@/lib/location";
import { cleanMeetUrl, liveIntakes } from "@/lib/meet-links";
import { ensureTeacherAccount, seedCourses, seedDemoStudents } from "@/lib/seed";
import { ensureSelfPacedCohorts } from "@/lib/self-paced";
import { previewCourses } from "@/lib/student";
import { askTutor } from "@/lib/tutor";
import { hashPassword } from "@/lib/passwords";
import { addMinutes } from "@/lib/time";
import { videoEmbedUrl } from "@/lib/video";
import { officeViewerUrl, slidesFileUrl, slidesFrom } from "@/lib/slides";

let db: Database;
let seeded: Awaited<ReturnType<typeof seedCourses>>;
let student: typeof schema.users.$inferSelect;

beforeEach(async () => {
  db = await createInMemoryDb();
  seeded = await seedCourses(db, { demo: true });
  [student] = await db
    .insert(schema.users)
    .values({ email: "amaka@example.com", name: "Amaka Obi", passwordHash: hashPassword("password123") })
    .returning();
});

async function enrolAndPay(cohortId: string, code: string | null = null) {
  const result = await startCheckout(db, student, cohortId, code);
  expect(result).toHaveProperty("redirectTo");
  const reference = (result as { redirectTo: string }).redirectTo.split("/").pop()!;
  await markPaymentSuccessful(db, reference);
  return reference;
}

describe("enrolment and payment", () => {
  it("sends students to the test checkout without a Paystack key, then activates the enrolment", async () => {
    const cohortId = seeded.animationNext.cohort.id;
    const result = await startCheckout(db, student, cohortId, null);
    expect(result).toEqual({ redirectTo: expect.stringMatching(/^\/pay\/test\/ACD-/) });

    const enrolment = await db.query.enrolments.findFirst({ where: eq(schema.enrolments.userId, student.id) });
    expect(enrolment?.status).toBe("pending");

    const reference = (result as { redirectTo: string }).redirectTo.split("/").pop()!;
    await markPaymentSuccessful(db, reference);
    await markPaymentSuccessful(db, reference); // a repeated webhook changes nothing

    const after = await db.query.enrolments.findFirst({ where: eq(schema.enrolments.userId, student.id) });
    expect(after?.status).toBe("active");
    const receipts = await db.query.emails.findMany({ where: eq(schema.emails.to, student.email) });
    expect(receipts).toHaveLength(1);
    expect(receipts[0].subject).toContain("You're enrolled");
    expect(receipts[0].mode).toBe("test");
  });

  it("applies discount codes and counts their use", async () => {
    const course = seeded.animationCourse;
    expect(await priceFor(db, course.id, course.priceKobo, "earlybird")).toEqual({ amountKobo: 4_000_000, code: "EARLYBIRD" });
    expect(await priceFor(db, course.id, course.priceKobo, "NOPE")).toHaveProperty("error");

    const reference = await enrolAndPay(seeded.animationNext.cohort.id, "EARLYBIRD");
    const payment = await db.query.payments.findFirst({ where: eq(schema.payments.reference, reference) });
    expect(payment?.amountKobo).toBe(4_000_000);
    const code = await db.query.discountCodes.findFirst({ where: eq(schema.discountCodes.code, "EARLYBIRD") });
    expect(code?.uses).toBe(1);
  });

  it("refuses closed or full intakes", async () => {
    expect(await startCheckout(db, student, seeded.animationDone!.cohort.id, null)).toEqual({ error: expect.stringContaining("closed") });
    await db.update(schema.cohorts).set({ capacity: 0 }).where(eq(schema.cohorts.id, seeded.animationNext.cohort.id));
    expect(await startCheckout(db, student, seeded.animationNext.cohort.id, null)).toEqual({ error: expect.stringContaining("full") });
  });

  it("does not activate a payment for less than the amount due", async () => {
    const result = await startCheckout(db, student, seeded.animationNext.cohort.id, null);
    const reference = (result as { redirectTo: string }).redirectTo.split("/").pop()!;
    expect(await markPaymentSuccessful(db, reference, { amountKobo: 100, currency: "NGN" })).toBeNull();
    const enrolment = await db.query.enrolments.findFirst({ where: eq(schema.enrolments.userId, student.id) });
    expect(enrolment?.status).toBe("pending");
  });

  it("lets students abroad pay the dollar price, with discount codes, and checks the currency", async () => {
    const cohortId = seeded.animationNext.cohort.id;
    expect(seeded.animationCourse.priceUsdCents).toBe(3500);
    expect(seeded.salesCourse.priceUsdCents).toBe(3500);
    // A course the teacher left without a dollar price can only be paid in naira.
    await db.update(schema.courses).set({ priceUsdCents: null }).where(eq(schema.courses.id, seeded.salesCourse.id));
    expect(await startCheckout(db, student, seeded.salesSelfPaced.cohort.id, null, "USD")).toEqual({ error: expect.stringContaining("naira") });
    await db.insert(schema.discountCodes).values({ code: "ANIMATE20", percentOff: 20, maxUses: 20, courseId: seeded.animationCourse.id });
    const result = await startCheckout(db, student, cohortId, "animate20", "USD");
    const reference = (result as { redirectTo: string }).redirectTo.split("/").pop()!;
    const payment = await db.query.payments.findFirst({ where: eq(schema.payments.reference, reference) });
    expect(payment).toMatchObject({ amountKobo: 2800, listPriceKobo: 3500, currency: "USD", discountCode: "ANIMATE20" });

    // 2800 kobo is not $28: a payment in the wrong currency never activates the enrolment.
    expect(await markPaymentSuccessful(db, reference, { amountKobo: 2800, currency: "NGN" })).toBeNull();
    expect((await markPaymentSuccessful(db, reference, { amountKobo: 2800, currency: "USD" }))?.reference).toBe(reference);
    const enrolment = await db.query.enrolments.findFirst({ where: eq(schema.enrolments.userId, student.id) });
    expect(enrolment?.status).toBe("active");
    const receipt = (await db.query.emails.findMany({ where: eq(schema.emails.to, student.email) })).find((e) => e.body.includes(reference));
    expect(receipt?.body).toContain("$28");
  });
});

describe("access only after payment", () => {
  it("keeps the course locked until the payment succeeds", async () => {
    const cohortId = seeded.animationNext.cohort.id;
    const result = await startCheckout(db, student, cohortId, null);
    const reference = (result as { redirectTo: string }).redirectTo.split("/").pop()!;
    const active = () =>
      db.query.enrolments.findFirst({
        where: and(eq(schema.enrolments.userId, student.id), eq(schema.enrolments.cohortId, cohortId), eq(schema.enrolments.status, "active")),
      });
    expect(await active()).toBeUndefined();
    await markPaymentSuccessful(db, reference);
    expect(await active()).toBeDefined();
  });

  it("closes checkout on the live site when Paystack isn't set up, instead of letting students in for free", async () => {
    const before = { node: process.env.NODE_ENV, allow: process.env.ALLOW_TEST_PAYMENTS };
    const envs = process.env as Record<string, string | undefined>;
    envs.NODE_ENV = "production";
    delete envs.ALLOW_TEST_PAYMENTS;
    try {
      const result = await startCheckout(db, student, seeded.animationNext.cohort.id, null);
      expect(result).toEqual({ error: expect.stringMatching(/payment isn't switched on/) });
      const enrolment = await db.query.enrolments.findFirst({ where: eq(schema.enrolments.userId, student.id) });
      expect(enrolment?.status ?? "none").not.toBe("active");
      envs.ALLOW_TEST_PAYMENTS = "true";
      expect(await startCheckout(db, student, seeded.animationNext.cohort.id, null)).toHaveProperty("redirectTo");
    } finally {
      envs.NODE_ENV = before.node;
      if (before.allow === undefined) delete envs.ALLOW_TEST_PAYMENTS;
      else envs.ALLOW_TEST_PAYMENTS = before.allow;
    }
  });

  it("removes access after a full refund, but not after a partial one", async () => {
    const cohortId = seeded.animationNext.cohort.id;
    const reference = await enrolAndPay(cohortId);
    const status = async () => (await db.query.enrolments.findFirst({ where: eq(schema.enrolments.userId, student.id) }))?.status;
    const payment = (await db.query.payments.findFirst({ where: eq(schema.payments.reference, reference) }))!;

    await markPaymentRefunded(db, reference, payment.amountKobo - 100);
    expect(await status()).toBe("active");

    await markPaymentRefunded(db, reference, payment.amountKobo);
    expect(await status()).toBe("cancelled");
    const after = await db.query.payments.findFirst({ where: eq(schema.payments.reference, reference) });
    expect(after?.status).toBe("refunded");
  });
});

describe("teacher's student view", () => {
  it("lists every course with an intake to open, without enrolling the teacher", async () => {
    await ensureSelfPacedCohorts(db);
    const courses = await previewCourses(db);
    const all = await db.query.courses.findMany();
    expect(courses).toHaveLength(all.length);
    for (const c of courses) expect(c.main?.courseId).toBe(c.course.id);
    const recorded = courses.find((c) => c.course.format === "recorded");
    if (recorded) expect(recorded.main?.selfPaced).toBe(true);
  });
});

describe("progress, badges and certificates", () => {
  it("issues the certificate once attendance and the final project meet the rule", async () => {
    // Use the finished intake: every class is in the past.
    const cohortId = seeded.animationDone!.cohort.id;
    await db.update(schema.cohorts).set({ enrolmentOpen: true, startsAt: new Date(Date.now() + 86400000) }).where(eq(schema.cohorts.id, cohortId));
    await enrolAndPay(cohortId);
    const lessons = seeded.animationDone!.classes;

    // 3 of 5 classes is 60%, below the 80% rule.
    await db.insert(schema.attendance).values(lessons.slice(0, 3).map((l) => ({ classId: l.id, userId: student.id, source: "join" as const })));
    const final = await db.query.assignments.findFirst({
      where: and(eq(schema.assignments.courseId, seeded.animationCourse.id), eq(schema.assignments.isFinalProject, true)),
    });
    await db.insert(schema.submissions).values({ assignmentId: final!.id, userId: student.id, cohortId, link: "https://example.com", grade: "pass" });
    await checkCompletion(db, student.id, cohortId);
    expect((await getProgress(db, student.id, cohortId)).certificateCode).toBeNull();

    // 4 of 5 is 80%: certificate issued, emailed, and the graduate badge awarded.
    await db.insert(schema.attendance).values({ classId: lessons[3].id, userId: student.id, source: "teacher" });
    await checkCompletion(db, student.id, cohortId);
    const progress = await getProgress(db, student.id, cohortId);
    expect(progress.certificateCode).toMatch(/^JTR-/);
    expect(progress.overallPercent).toBe(100);
    const badges = (await db.query.userBadges.findMany({ where: eq(schema.userBadges.userId, student.id) })).map((b) => b.badge);
    expect(badges).toEqual(expect.arrayContaining(["first-class", "first-assignment", "halfway", "final-project", "graduate"]));
    expect(badges).not.toContain("perfect-attendance");
    const cert = await db.query.certificates.findFirst({ where: eq(schema.certificates.userId, student.id) });
    expect(cert?.studentName).toBe("Amaka Obi");
    const emails = await db.query.emails.findMany({ where: eq(schema.emails.to, student.email) });
    expect(emails.some((e) => e.subject.startsWith("Your certificate"))).toBe(true);
  });
});

describe("recorded course", () => {
  it("is open to join any time, sends no reminders, and certifies once every lesson is watched", async () => {
    const { cohort, classes: lessons } = seeded.salesSelfPaced;
    expect(cohort.selfPaced).toBe(true);
    expect((await openCohorts(db, seeded.salesCourse.id)).map((c) => c.id)).toEqual([cohort.id]);
    await enrolAndPay(cohort.id);
    const welcome = await db.query.emails.findFirst({ where: eq(schema.emails.to, student.email) });
    expect(welcome?.body).toContain("video lessons");
    expect((await sendClassReminders(db)).emails).toBe(0);

    const final = await db.query.assignments.findFirst({
      where: and(eq(schema.assignments.courseId, seeded.salesCourse.id), eq(schema.assignments.isFinalProject, true)),
    });
    await db.insert(schema.submissions).values({ assignmentId: final!.id, userId: student.id, cohortId: cohort.id, link: "https://example.com", grade: "pass" });
    await db.insert(schema.attendance).values(lessons.slice(0, -1).map((l) => ({ classId: l.id, userId: student.id, source: "watched" as const })));
    await checkCompletion(db, student.id, cohort.id);
    expect((await getProgress(db, student.id, cohort.id)).certificateCode).toBeNull();

    await db.insert(schema.attendance).values({ classId: lessons.at(-1)!.id, userId: student.id, source: "watched" });
    await checkCompletion(db, student.id, cohort.id);
    expect((await getProgress(db, student.id, cohort.id)).certificateCode).toMatch(/^JTR-/);
  });

  it("gets its self-paced intake when an existing course switches to recorded", async () => {
    const course = seeded.animationCourse;
    await db.update(schema.courses).set({ format: "recorded" }).where(eq(schema.courses.id, course.id));
    const [created] = await ensureSelfPacedCohorts(db);
    expect(created.cohort.courseId).toBe(course.id);
    expect(created.classes.map((c) => c.notes)).toEqual(seeded.animationNext.classes.map((c) => c.notes));
    expect(await ensureSelfPacedCohorts(db)).toEqual([]);
    expect((await openCohorts(db, course.id)).map((c) => c.id)).toEqual([created.cohort.id]);
  });

  it("gives every Boost Sales lesson its slides, and the migration adds them to existing intakes once", async () => {
    const counts = [10, 10, 9, 10, 10, 9];
    const check = (rows: (typeof schema.classes.$inferSelect)[]) => {
      expect(rows.map((c) => [c.week, c.slides?.file, c.slides?.images.length])).toEqual(
        counts.map((n, i) => [i + 1, `/academy/slides/boost-sales-with-ai/lesson-${i + 1}.pptx`, n]),
      );
      for (const c of rows) for (const f of [c.slides!.file, ...c.slides!.images]) expect(existsSync(f.replace("/academy/", "public/"))).toBe(true);
    };
    check(seeded.salesSelfPaced.classes);

    const cohortId = seeded.salesSelfPaced.cohort.id;
    await db.update(schema.classes).set({ slides: null }).where(eq(schema.classes.cohortId, cohortId));
    const [, update] = readFileSync("drizzle/0007_lesson_slides.sql", "utf8").split("--> statement-breakpoint");
    await db.execute(update);
    const after = await db.query.classes.findMany({ where: eq(schema.classes.cohortId, cohortId), orderBy: schema.classes.week });
    check(after);
    // Slides Jules has changed are kept; other courses get none.
    await db.update(schema.classes).set({ slides: { file: "https://example.com/mine.pptx", images: [] } }).where(eq(schema.classes.id, after[0].id));
    await db.execute(update);
    expect((await db.query.classes.findFirst({ where: eq(schema.classes.id, after[0].id) }))?.slides?.file).toBe("https://example.com/mine.pptx");
    expect(seeded.animationNext.classes.every((c) => c.slides === null)).toBe(true);
  });

  it("keeps the slide images while the teacher's PowerPoint link is unchanged, and shows other links in the PowerPoint viewer", () => {
    const current = { file: "/academy/slides/boost-sales-with-ai/lesson-1.pptx", images: ["/academy/slides/boost-sales-with-ai/lesson-1/01.webp"] };
    expect(slidesFrom(" /academy/slides/boost-sales-with-ai/lesson-1.pptx ", current)).toBe(current);
    expect(slidesFrom("", current)).toBeNull();
    expect(slidesFrom("https://example.com/deck.pptx", current)).toEqual({ file: "https://example.com/deck.pptx", images: [] });
    expect(slidesFrom("javascript:alert(1)", null)).toHaveProperty("error");
    expect(slidesFileUrl(current, "https://academy.jtechright.com")).toBe("https://academy.jtechright.com/academy/slides/boost-sales-with-ai/lesson-1.pptx");
    expect(officeViewerUrl("https://example.com/a b.pptx")).toBe("https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Fa%20b.pptx");
  });

  it("turns video links into embeddable players", () => {
    expect(videoEmbedUrl("https://youtu.be/abc123XYZ")).toBe("https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0");
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=abc123XYZ&t=4")).toBe("https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0");
    expect(videoEmbedUrl("https://vimeo.com/76979871")).toBe("https://player.vimeo.com/video/76979871");
    expect(videoEmbedUrl("https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184")).toBe("https://www.loom.com/embed/0281766fa2d04bb788eaf19e65135184");
    expect(videoEmbedUrl("https://drive.google.com/file/d/1AbC/view?usp=sharing")).toBe("https://drive.google.com/file/d/1AbC/preview");
    expect(videoEmbedUrl("https://example.com/video.mp4")).toBeNull();
  });
});

describe("AI tutor (test mode)", () => {
  it("answers from the course notes and keeps the conversation", async () => {
    const cohortId = seeded.salesSelfPaced.cohort.id;
    const result = await askTutor(db, student.id, cohortId, "What is the selling formula for adverts?");
    expect(result.answer).toContain("Week 3");
    expect(result.answer).toContain("Problem, Promise, Proof, Push");
    const saved = await db.query.tutorMessages.findMany({ where: eq(schema.tutorMessages.userId, student.id) });
    expect(saved.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("rejects empty questions", async () => {
    expect(await askTutor(db, student.id, seeded.salesSelfPaced.cohort.id, "   ")).toHaveProperty("error");
  });
});

describe("class reminders", () => {
  it("emails enrolled students once about classes in the next 24 hours", async () => {
    const cohortId = seeded.animationNext.cohort.id;
    await enrolAndPay(cohortId);
    const first = seeded.animationNext.classes[0];
    await db.update(schema.classes).set({ startsAt: addMinutes(new Date(), 120) }).where(eq(schema.classes.id, first.id));
    expect((await sendClassReminders(db)).emails).toBe(1);
    expect((await sendClassReminders(db)).emails).toBe(0);
  });
});

describe("prices by location", () => {
  it("shows naira in Nigeria or when unknown, and dollars elsewhere for courses with a dollar price", () => {
    const both = { priceKobo: 5000000, priceUsdCents: 3500 };
    expect(localPrice("NG", both)).toEqual({ currency: "NGN", minor: 5000000 });
    expect(localPrice(null, both)).toEqual({ currency: "NGN", minor: 5000000 });
    expect(localPrice("GB", both)).toEqual({ currency: "USD", minor: 3500 });
    expect(localPrice("US", both)).toEqual({ currency: "USD", minor: 3500 });
    expect(currencyFor("GB", { priceUsdCents: null })).toBe("NGN");
  });
});

describe("Google Meet links", () => {
  it("accepts a pasted Meet link, with or without https://, and rejects anything else", () => {
    expect(cleanMeetUrl("https://meet.google.com/abc-defg-hij")).toEqual({ url: "https://meet.google.com/abc-defg-hij" });
    expect(cleanMeetUrl("  meet.google.com/abc-defg-hij ")).toEqual({ url: "https://meet.google.com/abc-defg-hij" });
    expect(cleanMeetUrl("")).toEqual({ url: "" });
    expect(cleanMeetUrl("abc defg")).toHaveProperty("error");
    expect(cleanMeetUrl("http://meet.google.com/abc")).toHaveProperty("error");
  });

  it("lists live intakes that haven't finished, not video courses or past intakes", async () => {
    const live = await createInMemoryDb();
    const s = await seedCourses(live, { demo: true });
    const ids = (await liveIntakes(live)).map((i) => i.cohort.id);
    expect(ids).toEqual([s.animationNext.cohort.id]);
  });
});

describe("going live", () => {
  it("seeds only the courses and an upcoming intake without demo mode", async () => {
    const live = await createInMemoryDb();
    const s = await seedCourses(live);
    expect(s.animationDone).toBeNull();
    expect(s.animationNext.cohort.meetUrl).toBe("");
    expect(await live.query.discountCodes.findMany()).toEqual([]);
    expect(await live.query.users.findMany()).toEqual([]);
  });

  it("runs Animation as a five-day course, one two-hour class a day", async () => {
    const live = await createInMemoryDb();
    const s = await seedCourses(live, {}, new Date("2026-11-02T12:00:00Z"));
    expect(s.animationCourse.lessonUnit).toBe("day");
    expect(s.animationNext.cohort.name).toBe("December 2026");
    expect(s.animationNext.classes.map((c) => [c.week, c.startsAt.toISOString(), c.durationMinutes])).toEqual(
      [1, 2, 3, 4, 5].map((day) => [day, `2026-12-0${day}T15:00:00.000Z`, 120]),
    );
  });

  it("removes the sample students and links but keeps real signups and courses", async () => {
    await seedDemoStudents(db, "demo1234", seeded);
    await enrolAndPay(seeded.animationNext.cohort.id);
    const sql = readFileSync("drizzle/0002_remove_demo_data.sql", "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) await db.execute(statement);

    const emails = (await db.query.users.findMany()).map((u) => u.email);
    expect(emails).toEqual(["amaka@example.com"]);
    expect(await db.query.certificates.findMany()).toEqual([]);
    expect(await db.query.courses.findMany()).toHaveLength(2);
    expect(await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, seeded.animationDone!.cohort.id) })).toBeUndefined();
    const next = await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, seeded.animationNext.cohort.id) });
    expect(next?.meetUrl).toBe("");
    const paid = await db.query.enrolments.findMany({ where: eq(schema.enrolments.userId, student.id) });
    expect(paid.map((e) => e.status)).toEqual(["active"]);
  });
});

describe("teacher account", () => {
  it("turns a student account with the teacher email into the teacher, with TEACHER_PASSWORD as its password", async () => {
    process.env.TEACHER_EMAIL = "amaka@example.com";
    process.env.TEACHER_PASSWORD = "teacher-secret";
    try {
      await ensureTeacherAccount(db);
      const user = await db.query.users.findFirst({ where: eq(schema.users.id, student.id) });
      expect(user?.role).toBe("teacher");
      const { verifyPassword } = await import("@/lib/passwords");
      expect(verifyPassword("teacher-secret", user!.passwordHash)).toBe(true);
      expect(verifyPassword("password123", user!.passwordHash)).toBe(false);

      process.env.TEACHER_PASSWORD = "new-secret";
      await ensureTeacherAccount(db);
      const again = await db.query.users.findFirst({ where: eq(schema.users.id, student.id) });
      expect(verifyPassword("new-secret", again!.passwordHash)).toBe(true);
    } finally {
      delete process.env.TEACHER_EMAIL;
      delete process.env.TEACHER_PASSWORD;
    }
  });
});

describe("helpers", () => {
  it("round-trips the quiz text format and explains mistakes", () => {
    const questions = [{ question: "Best shape for Reels?", options: ["16:9", "9:16"], answer: 1 }];
    expect(parseQuiz(quizToText(questions))).toEqual({ questions });
    expect(parseQuiz("Q: No right answer?\n- a\n- b")).toHaveProperty("error");
    expect(parseQuiz("hello")).toHaveProperty("error");
  });

  it("opens the Join button 30 minutes before a class and closes it at the end", () => {
    const startsAt = new Date("2026-11-03T18:00:00Z");
    const lesson = { startsAt, durationMinutes: 90 };
    expect(classState(lesson, addMinutes(startsAt, -31))).toBe("upcoming");
    expect(classState(lesson, addMinutes(startsAt, -30))).toBe("open");
    expect(classState(lesson, addMinutes(startsAt, 10))).toBe("live");
    expect(classState(lesson, addMinutes(startsAt, 91))).toBe("ended");
  });

  it("signs sessions and rejects tampered or expired ones", () => {
    const token = createSessionToken("user-1", 0);
    expect(readSessionToken(token, 1000)).toBe("user-1");
    expect(readSessionToken(token.replace("user-1", "user-2"), 1000)).toBeNull();
    expect(readSessionToken(token, 1000 * 60 * 60 * 24 * 31)).toBeNull();
  });
});
