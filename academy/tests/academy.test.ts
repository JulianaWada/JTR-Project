import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, readSessionToken } from "@/lib/auth";
import { openCohorts } from "@/lib/catalog";
import { checkCompletion } from "@/lib/certificates";
import { createInMemoryDb, type Database } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { markPaymentSuccessful, priceFor, startCheckout } from "@/lib/enrolment";
import { classState } from "@/lib/learn";
import { getProgress } from "@/lib/progress";
import { parseQuiz, quizToText } from "@/lib/quiz-format";
import { sendClassReminders } from "@/lib/reminders";
import { seedCourses } from "@/lib/seed";
import { ensureSelfPacedCohorts } from "@/lib/self-paced";
import { askTutor } from "@/lib/tutor";
import { hashPassword } from "@/lib/passwords";
import { addMinutes } from "@/lib/time";
import { videoEmbedUrl } from "@/lib/video";

let db: Database;
let seeded: Awaited<ReturnType<typeof seedCourses>>;
let student: typeof schema.users.$inferSelect;

beforeEach(async () => {
  db = await createInMemoryDb();
  seeded = await seedCourses(db);
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
    expect(await startCheckout(db, student, seeded.animationDone.cohort.id, null)).toEqual({ error: expect.stringContaining("closed") });
    await db.update(schema.cohorts).set({ capacity: 0 }).where(eq(schema.cohorts.id, seeded.animationNext.cohort.id));
    expect(await startCheckout(db, student, seeded.animationNext.cohort.id, null)).toEqual({ error: expect.stringContaining("full") });
  });

  it("does not activate a payment for less than the amount due", async () => {
    const result = await startCheckout(db, student, seeded.animationNext.cohort.id, null);
    const reference = (result as { redirectTo: string }).redirectTo.split("/").pop()!;
    expect(await markPaymentSuccessful(db, reference, { amountKobo: 100 })).toBeNull();
    const enrolment = await db.query.enrolments.findFirst({ where: eq(schema.enrolments.userId, student.id) });
    expect(enrolment?.status).toBe("pending");
  });
});

describe("progress, badges and certificates", () => {
  it("issues the certificate once attendance and the final project meet the rule", async () => {
    // Use the finished intake: every class is in the past.
    const cohortId = seeded.animationDone.cohort.id;
    await db.update(schema.cohorts).set({ enrolmentOpen: true, startsAt: new Date(Date.now() + 86400000) }).where(eq(schema.cohorts.id, cohortId));
    await enrolAndPay(cohortId);
    const lessons = seeded.animationDone.classes;

    // 4 of 6 classes is 67%, below the 80% rule.
    await db.insert(schema.attendance).values(lessons.slice(0, 4).map((l) => ({ classId: l.id, userId: student.id, source: "join" as const })));
    const final = await db.query.assignments.findFirst({
      where: and(eq(schema.assignments.courseId, seeded.animationCourse.id), eq(schema.assignments.isFinalProject, true)),
    });
    await db.insert(schema.submissions).values({ assignmentId: final!.id, userId: student.id, cohortId, link: "https://example.com", grade: "pass" });
    await checkCompletion(db, student.id, cohortId);
    expect((await getProgress(db, student.id, cohortId)).certificateCode).toBeNull();

    // 5 of 6 is 83%: certificate issued, emailed, and the graduate badge awarded.
    await db.insert(schema.attendance).values({ classId: lessons[4].id, userId: student.id, source: "teacher" });
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
