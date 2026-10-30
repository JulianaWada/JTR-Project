"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { checkCompletion, issueCertificate, revokeCertificate } from "@/lib/certificates";
import { getDb, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { url } from "@/lib/env";
import { koboFromNaira } from "@/lib/money";
import { parseQuiz, parseResources } from "@/lib/quiz-format";
import { addDays, fromLagos } from "@/lib/time";

// Every action here re-checks that the caller is the teacher; server actions are public endpoints.

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
  await requireTeacher();
  const db = await getDb();
  const title = str(form, "title");
  const price = Number(str(form, "price"));
  if (title.length < 3 || !Number.isFinite(price) || price < 0) back("/teach/courses", { error: "Add a title and a price." });
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
      published: false,
      outline: [1, 2, 3, 4, 5, 6].map((week) => ({ week, title: `Week ${week}`, summary: "" })),
      sortOrder: 100,
    })
    .returning();
  redirect(`/teach/courses/${course.id}?saved=${encodeURIComponent("Course created. Fill in the details, then publish it.")}`);
}

export async function updateCourse(courseId: string, form: FormData) {
  await requireTeacher();
  const db = await getDb();
  const path = `/teach/courses/${courseId}`;
  const price = Number(str(form, "price"));
  const pct = Number(str(form, "attendance"));
  if (!str(form, "title") || !Number.isFinite(price) || price < 0) back(path, { error: "Title and price are required." });
  if (!Number.isInteger(pct) || pct < 0 || pct > 100) back(path, { error: "Attendance must be a whole number from 0 to 100." });
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
      completionAttendancePercent: pct,
      requiresFinalProject: form.get("requiresFinalProject") === "on",
      published: form.get("published") === "on",
      accent: form.get("accent") === "violet" ? "violet" : "blue",
    })
    .where(eq(schema.courses.id, courseId));
  revalidatePath("/", "layout");
  back(path, { saved: "Course saved." });
}

export async function saveAssignment(courseId: string, assignmentId: string | null, form: FormData) {
  await requireTeacher();
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
  await requireTeacher();
  const db = await getDb();
  await db.delete(schema.assignments).where(and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.courseId, courseId)));
  back(`/teach/courses/${courseId}#assignments`, { saved: "Assignment deleted." });
}

export async function saveQuiz(courseId: string, quizId: string | null, form: FormData) {
  await requireTeacher();
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
  await requireTeacher();
  const db = await getDb();
  await db.delete(schema.quizzes).where(and(eq(schema.quizzes.id, quizId), eq(schema.quizzes.courseId, courseId)));
  back(`/teach/courses/${courseId}#quizzes`, { saved: "Quiz deleted." });
}

// Intakes (cohorts) and classes

/** A new intake with one weekly class per outline week. Notes are copied from the latest earlier intake. */
export async function createCohort(courseId: string, form: FormData) {
  await requireTeacher();
  const db = await getDb();
  const path = `/teach/courses/${courseId}#intakes`;
  const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, courseId) });
  if (!course) back("/teach/courses", { error: "Course not found." });
  const first = fromLagos(str(form, "date"), str(form, "time") || "19:00");
  const capacity = Number(str(form, "capacity") || "30");
  if (!str(form, "name") || !first) back(path, { error: "Give the intake a name and a first class date." });
  if (!Number.isInteger(capacity) || capacity < 1) back(path, { error: "Capacity must be a whole number." });

  const previous = await db.query.cohorts.findFirst({ where: eq(schema.cohorts.courseId, courseId), orderBy: desc(schema.cohorts.startsAt) });
  const template = previous ? await db.query.classes.findMany({ where: eq(schema.classes.cohortId, previous.id), orderBy: asc(schema.classes.week) }) : [];
  const [cohort] = await db
    .insert(schema.cohorts)
    .values({ courseId, name: str(form, "name"), startsAt: first, capacity, meetUrl: str(form, "meetUrl"), enrolmentOpen: true })
    .returning();
  const weeks = course.outline.length ? course.outline : [{ week: 1, title: "Week 1", summary: "" }];
  await db.insert(schema.classes).values(
    weeks.map((w, i) => {
      const copy = template.find((c) => c.week === w.week);
      return {
        cohortId: cohort.id,
        week: w.week,
        title: w.title,
        startsAt: addDays(first, i * 7),
        notes: copy?.notes ?? "",
        resources: copy?.resources ?? [],
      };
    }),
  );
  redirect(`/teach/cohorts/${cohort.id}?saved=${encodeURIComponent("Intake created with a weekly class for each week of the outline.")}`);
}

export async function updateCohort(cohortId: string, form: FormData) {
  await requireTeacher();
  const db = await getDb();
  const path = `/teach/cohorts/${cohortId}`;
  const capacity = Number(str(form, "capacity"));
  if (!str(form, "name") || !Number.isInteger(capacity) || capacity < 1) back(path, { error: "Name and a whole-number capacity are required." });
  await db
    .update(schema.cohorts)
    .set({ name: str(form, "name"), capacity, meetUrl: str(form, "meetUrl"), enrolmentOpen: form.get("enrolmentOpen") === "on" })
    .where(eq(schema.cohorts.id, cohortId));
  revalidatePath("/", "layout");
  back(path, { saved: "Intake saved." });
}

export async function saveClass(cohortId: string, classId: string | null, form: FormData) {
  await requireTeacher();
  const db = await getDb();
  const path = classId ? `/teach/cohorts/${cohortId}/classes/${classId}` : `/teach/cohorts/${cohortId}`;
  const startsAt = fromLagos(str(form, "date"), str(form, "time"));
  const duration = Number(str(form, "duration") || "90");
  const week = Number(str(form, "week"));
  if (!startsAt || !str(form, "title") || !Number.isInteger(week) || week < 1) back(path, { error: "A class needs a week, a title, a date and a time." });
  const values = {
    week,
    title: str(form, "title"),
    startsAt,
    durationMinutes: Number.isInteger(duration) && duration > 0 ? duration : 90,
    meetUrl: str(form, "meetUrl") || null,
    recordingUrl: str(form, "recordingUrl") || null,
    notes: String(form.get("notes") ?? ""),
    resources: parseResources(String(form.get("resources") ?? "")),
  };
  if (classId) {
    const existing = await db.query.classes.findFirst({ where: and(eq(schema.classes.id, classId), eq(schema.classes.cohortId, cohortId)) });
    // Moving a class re-arms its reminder.
    const moved = existing && existing.startsAt.getTime() !== startsAt.getTime();
    await db
      .update(schema.classes)
      .set({ ...values, ...(moved ? { reminderSentAt: null } : {}) })
      .where(and(eq(schema.classes.id, classId), eq(schema.classes.cohortId, cohortId)));
    back(path, { saved: "Class saved." });
  }
  const [created] = await db.insert(schema.classes).values({ ...values, cohortId }).returning();
  redirect(`/teach/cohorts/${cohortId}/classes/${created.id}?saved=${encodeURIComponent("Class added.")}`);
}

export async function deleteClass(cohortId: string, classId: string) {
  await requireTeacher();
  const db = await getDb();
  await db.delete(schema.classes).where(and(eq(schema.classes.id, classId), eq(schema.classes.cohortId, cohortId)));
  back(`/teach/cohorts/${cohortId}`, { saved: "Class deleted." });
}

/** Saves the whole attendance grid for an intake. */
export async function saveAttendance(cohortId: string, form: FormData) {
  await requireTeacher();
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
  await requireTeacher();
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
  await requireTeacher();
  await issueCertificate(await getDb(), userId, cohortId, { force: true });
  back(`/teach/cohorts/${cohortId}#students`, { saved: "Certificate issued and emailed." });
}

export async function revokeCertificateAction(cohortId: string, code: string) {
  await requireTeacher();
  await revokeCertificate(await getDb(), code);
  back(`/teach/cohorts/${cohortId}#students`, { saved: "Certificate withdrawn." });
}

// Marking

export async function markSubmission(submissionId: string, form: FormData) {
  await requireTeacher();
  const db = await getDb();
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
      grade === "pass" ? `Your assignment "${assignment.title}" has passed. Well done!` : `Jules has asked you to update "${assignment.title}" and hand it in again.`,
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
  await requireTeacher();
  const db = await getDb();
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
    courseId: str(form, "courseId") || null,
    maxUses: maxUses && Number.isInteger(maxUses) && maxUses > 0 ? maxUses : null,
  });
  back("/teach/payments#discounts", { saved: `Code ${code} created.` });
}

export async function toggleDiscount(code: string) {
  await requireTeacher();
  const db = await getDb();
  const discount = await db.query.discountCodes.findFirst({ where: eq(schema.discountCodes.code, code) });
  if (discount) await db.update(schema.discountCodes).set({ active: !discount.active }).where(eq(schema.discountCodes.code, code));
  back("/teach/payments#discounts", { saved: discount?.active ? `Code ${code} turned off.` : `Code ${code} turned on.` });
}
