"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireTeacher } from "@/lib/auth";
import { checkCompletion, issueCertificate, revokeCertificate } from "@/lib/certificates";
import { getDb, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env, url } from "@/lib/env";
import { cleanMeetUrl } from "@/lib/meet-links";
import { koboFromNaira } from "@/lib/money";
import { parseQuiz, parseResources } from "@/lib/quiz-format";
import { ensureSelfPacedCohorts } from "@/lib/self-paced";
import { slidesFrom } from "@/lib/slides";
import { canManageCohort, canManageCourse, ownCourseIds } from "@/lib/teachers";
import { addDays, fromLagos } from "@/lib/time";

// Every action here re-checks that the caller is a teacher of that course (or the admin); server actions are public endpoints.

/** The signed-in teacher, if they run this course; otherwise back to their course list. */
async function courseTeacher(courseId: string) {
  const user = await requireTeacher();
  if (!(await canManageCourse(await getDb(), user, courseId))) back("/teach/courses", { error: "That course isn't one of yours." });
  return user;
}

/** The signed-in teacher, if they run this intake's course. */
async function cohortTeacher(cohortId: string) {
  const user = await requireTeacher();
  if (!(await canManageCohort(await getDb(), user, cohortId))) back("/teach/courses", { error: "That intake isn't one of yours." });
  return user;
}

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function back(path: string, message: { error?: string; saved?: string }): never {
  const qs = message.error ? `error=${encodeURIComponent(message.error)}` : `saved=${encodeURIComponent(message.saved ?? "Saved")}`;
  const [base, hash] = path.split("#");
  redirect(`${base}${base.includes("?") ? "&" : "?"}${qs}${hash ? `#${hash}` : ""}`);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// Courses

export async function createCourse(form: FormData) {
  const user = await requireTeacher();
  const db = await getDb();
  const title = str(form, "title");
  const price = Number(str(form, "price"));
  if (title.length < 3 || !Number.isFinite(price) || price < 0) back("/teach/courses", { error: "Add a title and a price." });
  const priceUsd = str(form, "priceUsd") ? Number(str(form, "priceUsd")) : null;
  if (priceUsd !== null && (!Number.isFinite(priceUsd) || priceUsd < 1)) back("/teach/courses", { error: "The dollar price must be at least $1, or leave it empty for naira only." });
  let slug = slugify(title) || "course";
  if (await db.query.courses.findFirst({ where: eq(schema.courses.slug, slug) })) slug = `${slug}-${Date.now().toString(36)}`;
  const [course] = await db
    .insert(schema.courses)
    .values({
      slug,
      title,
      tagline: str(form, "tagline") || title,
      description: "",
      priceKobo: koboFromNaira(price),
      priceUsdCents: priceUsd === null ? null : Math.round(priceUsd * 100),
      published: false,
      outline: [1, 2, 3, 4, 5, 6].map((week) => ({ week, title: `Week ${week}`, summary: "" })),
      sortOrder: 100,
      // The admin's new courses are JTR Academy courses; everyone else's are their own.
      teacherId: user.isAdmin ? null : user.id,
    })
    .returning();
  redirect(`/teach/courses/${course.id}?saved=${encodeURIComponent("Course created. Fill in the details, then publish it.")}`);
}

export async function updateCourse(courseId: string, form: FormData) {
  const user = await courseTeacher(courseId);
  const db = await getDb();
  const path = `/teach/courses/${courseId}`;
  const price = Number(str(form, "price"));
  const pct = Number(str(form, "attendance"));
  if (!str(form, "title") || !Number.isFinite(price) || price < 0) back(path, { error: "Title and price are required." });
  if (!Number.isInteger(pct) || pct < 0 || pct > 100) back(path, { error: "The share needed for the certificate must be a whole number from 0 to 100." });
  const priceUsd = str(form, "priceUsd") ? Number(str(form, "priceUsd")) : null;
  if (priceUsd !== null && (!Number.isFinite(priceUsd) || priceUsd < 1)) back(path, { error: "The dollar price must be at least $1, or leave it empty for naira only." });
  const format = form.get("format") === "recorded" ? "recorded" : "live";
  const before = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
  const outline = str(form, "outline")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [title, ...summary] = line.split("|");
      return { week: i + 1, title: title.trim(), summary: summary.join("|").trim() };
    });
  await db
    .update(schema.courses)
    .set({
      title: str(form, "title"),
      tagline: str(form, "tagline"),
      description: str(form, "description"),
      audience: str(form, "audience"),
      outcomes: str(form, "outcomes"),
      outline,
      priceKobo: koboFromNaira(price),
      ...(form.has("priceUsd") ? { priceUsdCents: priceUsd === null ? null : Math.round(priceUsd * 100) } : {}),
      format,
      ...(form.has("lessonUnit") ? { lessonUnit: form.get("lessonUnit") === "day" ? ("day" as const) : ("week" as const) } : {}),
      completionAttendancePercent: pct,
      requiresFinalProject: form.get("requiresFinalProject") === "on",
      published: form.get("published") === "on",
      accent: form.get("accent") === "violet" ? "violet" : "blue",
      ...(user.isAdmin && form.has("teacherId") ? { teacherId: await approvedTeacherId(str(form, "teacherId")) } : {}),
    })
    .where(eq(schema.courses.id, courseId));
  if (before && before.format !== format) await switchFormat(courseId, format);
  revalidatePath("/", "layout");
  back(path, { saved: format === "recorded" && before?.format !== format ? "Saved. This is now a video course: add a video to each lesson below." : "Course saved." });
}

/** An approved teacher's id, or null (a JTR Academy course) for anything else. */
async function approvedTeacherId(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const profile = await (await getDb()).query.teacherProfiles.findFirst({ where: eq(schema.teacherProfiles.userId, id) });
  return profile?.status === "approved" ? id : null;
}

/** Recorded: students enroll in the self-paced intake (created if needed). Live: they choose a dated intake again. */
async function switchFormat(courseId: string, format: "live" | "recorded") {
  const db = await getDb();
  if (format === "recorded") {
    await ensureSelfPacedCohorts(db);
    await db.update(schema.cohorts).set({ enrolmentOpen: false }).where(and(eq(schema.cohorts.courseId, courseId), eq(schema.cohorts.selfPaced, false)));
  }
  await db
    .update(schema.cohorts)
    .set({ enrolmentOpen: format === "recorded" })
    .where(and(eq(schema.cohorts.courseId, courseId), eq(schema.cohorts.selfPaced, true)));
}

export async function saveAssignment(courseId: string, assignmentId: string | null, form: FormData) {
  await courseTeacher(courseId);
  const db = await getDb();
  const path = `/teach/courses/${courseId}#assignments`;
  const week = Number(str(form, "week"));
  const values = { title: str(form, "title"), brief: str(form, "brief"), week, isFinalProject: form.get("isFinalProject") === "on" };
  if (!values.title || !values.brief || !Number.isInteger(week) || week < 1) back(path, { error: "An assignment needs a week, a title and a brief." });
  if (assignmentId) await db.update(schema.assignments).set(values).where(and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.courseId, courseId)));
  else await db.insert(schema.assignments).values({ ...values, courseId });
  back(path, { saved: "Assignment saved." });
}

export async function deleteAssignment(courseId: string, assignmentId: string) {
  await courseTeacher(courseId);
  const db = await getDb();
  await db.delete(schema.assignments).where(and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.courseId, courseId)));
  back(`/teach/courses/${courseId}#assignments`, { saved: "Assignment deleted." });
}

export async function saveQuiz(courseId: string, quizId: string | null, form: FormData) {
  await courseTeacher(courseId);
  const db = await getDb();
  const path = `/teach/courses/${courseId}#quizzes`;
  const week = Number(str(form, "week"));
  const parsed = parseQuiz(String(form.get("questions") ?? ""));
  if ("error" in parsed) back(path, { error: parsed.error });
  if (!str(form, "title") || !Number.isInteger(week) || week < 1) back(path, { error: "A quiz needs a week and a title." });
  const values = { title: str(form, "title"), week, questions: parsed.questions };
  if (quizId) await db.update(schema.quizzes).set(values).where(and(eq(schema.quizzes.id, quizId), eq(schema.quizzes.courseId, courseId)));
  else await db.insert(schema.quizzes).values({ ...values, courseId });
  back(path, { saved: "Quiz saved." });
}

export async function deleteQuiz(courseId: string, quizId: string) {
  await courseTeacher(courseId);
  const db = await getDb();
  await db.delete(schema.quizzes).where(and(eq(schema.quizzes.id, quizId), eq(schema.quizzes.courseId, courseId)));
  back(`/teach/courses/${courseId}#quizzes`, { saved: "Quiz deleted." });
}

// Intakes (cohorts) and classes

/** A new intake with one class per outline line, weekly or daily as the course says. Notes are copied from the latest earlier intake. */
export async function createCohort(courseId: string, form: FormData) {
  await courseTeacher(courseId);
  const db = await getDb();
  const path = `/teach/courses/${courseId}#intakes`;
  const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
  if (!course) back("/teach/courses", { error: "Course not found." });
  const first = fromLagos(str(form, "date"), str(form, "time") || "19:00");
  const capacity = Number(str(form, "capacity") || "30");
  const daily = course?.lessonUnit === "day";
  const duration = Number(str(form, "duration") || (daily ? "120" : "90"));
  if (!str(form, "name") || !first) back(path, { error: "Give the intake a name and a first class date." });
  if (!Number.isInteger(capacity) || capacity < 1) back(path, { error: "Capacity must be a whole number." });
  if (!Number.isInteger(duration) || duration < 15 || duration > 600) back(path, { error: "Class length must be between 15 and 600 minutes." });

  const previous = await db.query.cohorts.findFirst({ where: eq(schema.cohorts.courseId, courseId), orderBy: desc(schema.cohorts.startsAt) });
  const template = previous ? await db.query.classes.findMany({ where: eq(schema.classes.cohortId, previous.id), orderBy: asc(schema.classes.week) }) : [];
  const [cohort] = await db
    .insert(schema.cohorts)
    .values({ courseId, name: str(form, "name"), startsAt: first, capacity, meetUrl: str(form, "meetUrl"), room: str(form, "meetUrl") ? "link" : "jtr", enrolmentOpen: true })
    .returning();
  const weeks = course.outline.length ? course.outline : [{ week: 1, title: "Week 1", summary: "" }];
  await db.insert(schema.classes).values(
    weeks.map((w, i) => {
      const copy = template.find((c) => c.week === w.week);
      return {
        cohortId: cohort.id,
        week: w.week,
        title: w.title,
        startsAt: addDays(first, i * (daily ? 1 : 7)),
        durationMinutes: duration,
        notes: copy?.notes ?? "",
        resources: copy?.resources ?? [],
        slides: copy?.slides ?? null,
      };
    }),
  );
  redirect(`/teach/cohorts/${cohort.id}?saved=${encodeURIComponent(daily ? "Intake created with a class on each day of the outline." : "Intake created with a weekly class for each week of the outline.")}`);
}

/** The Class rooms page (and the overview): the JTR class room, or the one outside link every class of an intake uses. */
export async function saveMeetLink(cohortId: string, returnTo: string, form: FormData) {
  await cohortTeacher(cohortId);
  const db = await getDb();
  const path = returnTo.startsWith("/teach") ? returnTo : "/teach/meet";
  const cohort = await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, cohortId) });
  if (!cohort) back(path, { error: "Intake not found." });
  const room = form.get("room") === "link" ? "link" : "jtr";
  const cleaned = cleanMeetUrl(str(form, "meetUrl"));
  if ("error" in cleaned) back(path, { error: cleaned.error });
  if (room === "link" && !cleaned.url) back(path, { error: "Paste the outside link, or choose the JTR class room." });
  await db.update(schema.cohorts).set({ room, meetUrl: cleaned.url }).where(eq(schema.cohorts.id, cohortId));
  revalidatePath("/", "layout");
  back(path, {
    saved:
      room === "jtr"
        ? `${cohort.name} classes will happen in the JTR class room. Students join from their dashboard.`
        : `Outside link saved for ${cohort.name}. Students join with it from their dashboard.`,
  });
}

export async function updateCohort(cohortId: string, form: FormData) {
  await cohortTeacher(cohortId);
  const db = await getDb();
  const path = `/teach/cohorts/${cohortId}`;
  const capacity = Number(str(form, "capacity"));
  if (!str(form, "name") || !Number.isInteger(capacity) || capacity < 1) back(path, { error: "Name and a whole-number capacity are required." });
  // Where classes happen has its own box now (MeetLinkCard); only change the link if this form sent one.
  const meet = form.has("meetUrl") ? cleanMeetUrl(str(form, "meetUrl")) : { url: undefined };
  if ("error" in meet) back(path, { error: meet.error });
  await db
    .update(schema.cohorts)
    .set({ name: str(form, "name"), capacity, meetUrl: meet.url, enrolmentOpen: form.get("enrolmentOpen") === "on" })
    .where(eq(schema.cohorts.id, cohortId));
  revalidatePath("/", "layout");
  back(path, { saved: "Intake saved." });
}

export async function saveClass(cohortId: string, classId: string | null, form: FormData) {
  await cohortTeacher(cohortId);
  const db = await getDb();
  const path = classId ? `/teach/cohorts/${cohortId}/classes/${classId}` : `/teach/cohorts/${cohortId}`;
  const cohort = await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, cohortId) });
  if (!cohort) back("/teach/courses", { error: "Intake not found." });
  const existing = classId
    ? await db.query.classes.findFirst({ where: and(eq(schema.classes.id, classId), eq(schema.classes.cohortId, cohortId)) })
    : undefined;
  // Video lessons keep their place in the list; a new one goes at the end.
  const startsAt = cohort.selfPaced ? (existing?.startsAt ?? new Date()) : fromLagos(str(form, "date"), str(form, "time"));
  const duration = Number(str(form, "duration") || "90");
  const week = Number(str(form, "week"));
  if (!startsAt || !str(form, "title") || !Number.isInteger(week) || week < 1)
    back(path, { error: cohort.selfPaced ? "A lesson needs a number and a title." : "A class needs a week, a title, a date and a time." });
  const slides = slidesFrom(str(form, "slidesFile"), existing?.slides ?? null);
  if (slides && "error" in slides) back(path, { error: slides.error });
  const values = {
    week,
    title: str(form, "title"),
    startsAt,
    durationMinutes: cohort.selfPaced ? 0 : Number.isInteger(duration) && duration > 0 ? duration : 90,
    meetUrl: str(form, "meetUrl") || null,
    recordingUrl: str(form, "recordingUrl") || null,
    notes: String(form.get("notes") ?? ""),
    resources: parseResources(String(form.get("resources") ?? "")),
    slides,
  };
  if (classId) {
    // Moving a class re-arms its reminder.
    const moved = existing && existing.startsAt.getTime() !== startsAt.getTime();
    await db
      .update(schema.classes)
      .set({ ...values, ...(moved ? { reminderSentAt: null } : {}) })
      .where(and(eq(schema.classes.id, classId), eq(schema.classes.cohortId, cohortId)));
    back(path, { saved: cohort.selfPaced ? "Lesson saved." : "Class saved." });
  }
  const [created] = await db.insert(schema.classes).values({ ...values, cohortId }).returning();
  redirect(`/teach/cohorts/${cohortId}/classes/${created.id}?saved=${encodeURIComponent(cohort.selfPaced ? "Lesson added." : "Class added.")}`);
}

export async function deleteClass(cohortId: string, classId: string) {
  await cohortTeacher(cohortId);
  const db = await getDb();
  await db.delete(schema.classes).where(and(eq(schema.classes.id, classId), eq(schema.classes.cohortId, cohortId)));
  back(`/teach/cohorts/${cohortId}`, { saved: "Class deleted." });
}

/** Saves the whole attendance grid for an intake. */
export async function saveAttendance(cohortId: string, form: FormData) {
  await cohortTeacher(cohortId);
  const db = await getDb();
  const lessons = await db.query.classes.findMany({ where: eq(schema.classes.cohortId, cohortId) });
  const classIds = lessons.map((l) => l.id);
  const active = await db.query.enrolments.findMany({
    where: and(eq(schema.enrolments.cohortId, cohortId), eq(schema.enrolments.status, "active")),
  });
  const ticked = new Set(form.getAll("present").map(String));
  const existing = classIds.length ? await db.query.attendance.findMany({ where: inArray(schema.attendance.classId, classIds) }) : [];
  const has = new Set(existing.map((a) => `${a.userId}:${a.classId}`));
  for (const e of active) {
    for (const classId of classIds) {
      const key = `${e.userId}:${classId}`;
      if (ticked.has(key) && !has.has(key)) {
        await db.insert(schema.attendance).values({ classId, userId: e.userId, source: "teacher" }).onConflictDoNothing();
      } else if (!ticked.has(key) && has.has(key)) {
        await db.delete(schema.attendance).where(and(eq(schema.attendance.classId, classId), eq(schema.attendance.userId, e.userId)));
      }
    }
    await checkCompletion(db, e.userId, cohortId);
  }
  back(`/teach/cohorts/${cohortId}#students`, { saved: "Attendance saved." });
}

export async function sendAnnouncement(cohortId: string, form: FormData) {
  await cohortTeacher(cohortId);
  const db = await getDb();
  const path = `/teach/cohorts/${cohortId}#announce`;
  const subject = str(form, "subject");
  const body = String(form.get("body") ?? "").trim();
  if (!subject || !body) back(path, { error: "Add a subject and a message." });
  const active = await db.query.enrolments.findMany({
    where: and(eq(schema.enrolments.cohortId, cohortId), eq(schema.enrolments.status, "active")),
  });
  if (!active.length) back(path, { error: "No enrolled students to email yet." });
  const students = await db.query.users.findMany({ where: inArray(schema.users.id, active.map((e) => e.userId)) });
  for (const s of students) {
    await sendEmail(db, { to: s.email, subject, body: `Hi ${s.name.split(" ")[0]},\n\n${body}\n\nYour course: ${url(`/learn/${cohortId}`)}` });
  }
  back(path, { saved: `Announcement sent to ${students.length} student${students.length === 1 ? "" : "s"}.` });
}

export async function issueCertificateAction(cohortId: string, userId: string) {
  await cohortTeacher(cohortId);
  const enrolled = await (await getDb()).query.enrolments.findFirst({
    where: and(eq(schema.enrolments.cohortId, cohortId), eq(schema.enrolments.userId, userId), eq(schema.enrolments.status, "active")),
  });
  if (!enrolled) back(`/teach/cohorts/${cohortId}#students`, { error: "That student isn't in this intake." });
  await issueCertificate(await getDb(), userId, cohortId, { force: true });
  back(`/teach/cohorts/${cohortId}#students`, { saved: "Certificate issued and emailed." });
}

export async function revokeCertificateAction(cohortId: string, code: string) {
  await cohortTeacher(cohortId);
  const db = await getDb();
  const cert = await db.query.certificates.findFirst({ where: eq(schema.certificates.code, code) });
  if (!cert || cert.cohortId !== cohortId) back(`/teach/cohorts/${cohortId}#students`, { error: "Certificate not found." });
  await revokeCertificate(db, code);
  back(`/teach/cohorts/${cohortId}#students`, { saved: "Certificate withdrawn." });
}

// Marking

export async function markSubmission(submissionId: string, form: FormData) {
  const user = await requireTeacher();
  const db = await getDb();
  const target = await db.query.submissions.findFirst({ where: eq(schema.submissions.id, submissionId), columns: { cohortId: true } });
  if (!target || !(await canManageCohort(db, user, target.cohortId))) back("/teach/marking", { error: "Submission not found." });
  const grade = form.get("grade") === "pass" ? "pass" : "redo";
  const [submission] = await db
    .update(schema.submissions)
    .set({ grade, feedback: str(form, "feedback") || null, markedAt: new Date() })
    .where(eq(schema.submissions.id, submissionId))
    .returning();
  if (!submission) back("/teach/marking", { error: "Submission not found." });
  const student = (await db.query.users.findFirst({ where: eq(schema.users.id, submission.userId) }))!;
  const assignment = (await db.query.assignments.findFirst({ where: eq(schema.assignments.id, submission.assignmentId) }))!;
  await sendEmail(db, {
    to: student.email,
    subject: grade === "pass" ? `Passed: ${assignment.title}` : `Please take another look: ${assignment.title}`,
    body: [
      `Hi ${student.name.split(" ")[0]},`,
      "",
      grade === "pass" ? `Your assignment "${assignment.title}" has passed. Well done!` : `Your teacher has asked you to update "${assignment.title}" and hand it in again.`,
      submission.feedback ? `\nFeedback: ${submission.feedback}` : "",
      "",
      url(`/learn/${submission.cohortId}/assignments/${assignment.id}`),
    ].join("\n"),
  });
  await checkCompletion(db, submission.userId, submission.cohortId);
  back("/teach/marking", { saved: `Marked "${assignment.title}" for ${student.name}.` });
}

// Payments

export async function createDiscount(form: FormData) {
  const user = await requireTeacher();
  const db = await getDb();
  // Teachers make codes for their own courses only; a code for every course is the admin's.
  const courseId = str(form, "courseId") || null;
  if (!user.isAdmin && (!courseId || !(await canManageCourse(db, user, courseId)))) back("/teach/payments#discounts", { error: "Choose one of your courses for the code." });
  const code = str(form, "code").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const percent = Number(str(form, "percent"));
  const maxUses = str(form, "maxUses") ? Number(str(form, "maxUses")) : null;
  if (code.length < 3 || !Number.isInteger(percent) || percent < 1 || percent > 100) {
    back("/teach/payments#discounts", { error: "Use a code of at least 3 letters or numbers and a discount from 1 to 100%." });
  }
  if (await db.query.discountCodes.findFirst({ where: eq(schema.discountCodes.code, code) })) back("/teach/payments#discounts", { error: "That code already exists." });
  await db.insert(schema.discountCodes).values({
    code,
    percentOff: percent,
    courseId,
    maxUses: maxUses && Number.isInteger(maxUses) && maxUses > 0 ? maxUses : null,
  });
  back("/teach/payments#discounts", { saved: `Code ${code} created.` });
}

export async function toggleDiscount(code: string) {
  const user = await requireTeacher();
  const db = await getDb();
  const discount = await db.query.discountCodes.findFirst({ where: eq(schema.discountCodes.code, code) });
  if (discount && !user.isAdmin) {
    const mine = await ownCourseIds(db, user);
    if (!discount.courseId || !mine?.includes(discount.courseId)) back("/teach/payments#discounts", { error: "That code isn't one of yours." });
  }
  if (discount) await db.update(schema.discountCodes).set({ active: !discount.active }).where(eq(schema.discountCodes.code, code));
  back("/teach/payments#discounts", { saved: discount?.active ? `Code ${code} turned off.` : `Code ${code} turned on.` });
}

/** Sends a sample "You're enrolled" email, so the teacher can check that emails really arrive. */
export async function sendTestEmail(form: FormData) {
  const user = await requireAdmin();
  const to = String(form.get("to") ?? "").trim() || user.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) back("/teach/outbox", { error: "Please enter a valid email address." });
  const db = await getDb();
  const result = await sendEmail(db, {
    to,
    subject: "Test email from JTR Academy",
    body: [
      "Hi,",
      "",
      "This is a test from your JTR Academy teacher dashboard. If you can read this, the academy can send emails:",
      "students will get their \"You're enrolled\" receipt after paying, class reminders, marking results and certificates.",
      "",
      `Sent from ${env.emailFrom}. Your academy: ${url("/")}`,
      "",
      "Jules, JTR Academy",
    ].join("\n"),
  });
  revalidatePath("/teach/outbox");
  if (result.mode === "test") back("/teach/outbox", { error: "Not sent: RESEND_API_KEY isn't set on the academy Vercel project, so emails are only saved here." });
  if (result.error) back("/teach/outbox", { error: `Resend refused the email: ${result.error}` });
  back("/teach/outbox", { saved: `Test email sent to ${to}. Check that inbox (and the spam folder).` });
}
