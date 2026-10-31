import { and, asc, desc, eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { certificates, classes, cohorts, courses, enrolments, submissions, tutorMessages } from "@/lib/db/schema";
import { addMinutes } from "@/lib/time";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type Activity = { at: Date; kind: "payment" | "submission" | "certificate" | "question"; text: string; href: string };

/** Everything the teacher overview shows, in one pass over the (small) academy tables. */
export async function teacherDashboard(db: Database, now = new Date()) {
  const [courseRows, cohortRows, enrolmentRows, paymentRows, submissionRows, certificateRows, questionRows, classRows, userRows, assignmentRows] = await Promise.all([
    db.query.courses.findMany({ orderBy: asc(courses.sortOrder) }),
    db.query.cohorts.findMany(),
    db.query.enrolments.findMany(),
    db.query.payments.findMany(),
    db.query.submissions.findMany({ orderBy: desc(submissions.submittedAt) }),
    db.query.certificates.findMany({ orderBy: desc(certificates.issuedAt) }),
    db.query.tutorMessages.findMany({ where: eq(tutorMessages.role, "user"), orderBy: desc(tutorMessages.createdAt), limit: 10 }),
    db.query.classes.findMany({ orderBy: asc(classes.startsAt) }),
    db.query.users.findMany(),
    db.query.assignments.findMany(),
  ]);
  const userName = (id: string) => userRows.find((u) => u.id === id)?.name ?? "A student";
  const cohortOf = (id: string) => cohortRows.find((c) => c.id === id)!;
  const courseOfCohort = (id: string) => courseRows.find((c) => c.id === cohortOf(id).courseId)!;
  const enrolmentById = new Map(enrolmentRows.map((e) => [e.id, e]));

  const paid = paymentRows.filter((p) => p.status === "success" && p.paidAt);
  const monthKey = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();
  const thisMonth = monthKey(now);
  const incomeByMonth = Array.from({ length: 6 }, (_, i) => {
    const key = thisMonth - 5 + i;
    return {
      label: MONTHS[((key % 12) + 12) % 12],
      kobo: paid.filter((p) => monthKey(p.paidAt!) === key).reduce((sum, p) => sum + p.amountKobo, 0),
    };
  });
  const active = enrolmentRows.filter((e) => e.status === "active");
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const newStudents = new Set(active.filter((e) => e.enrolledAt && e.enrolledAt >= thirtyDaysAgo).map((e) => e.userId)).size;
  const liveCertificates = certificateRows.filter((c) => !c.revokedAt);

  const byCourse = courseRows.map((course) => {
    const cohortIds = new Set(cohortRows.filter((c) => c.courseId === course.id).map((c) => c.id));
    const courseEnrolments = active.filter((e) => cohortIds.has(e.cohortId));
    return {
      course,
      students: courseEnrolments.length,
      incomeKobo: paid.filter((p) => cohortIds.has(enrolmentById.get(p.enrolmentId)?.cohortId ?? "")).reduce((sum, p) => sum + p.amountKobo, 0),
      certificates: liveCertificates.filter((c) => cohortIds.has(c.cohortId)).length,
      selfPacedId: cohortRows.find((c) => c.courseId === course.id && c.selfPaced)?.id ?? null,
    };
  });

  const toMark = submissionRows.filter((s) => s.grade === null);
  const selfPacedIds = new Set(cohortRows.filter((c) => c.selfPaced).map((c) => c.id));
  const missingVideos = classRows.filter((c) => selfPacedIds.has(c.cohortId) && !c.recordingUrl && courseOfCohort(c.cohortId).format === "recorded");
  const missingRecordings = classRows.filter(
    (c) => !selfPacedIds.has(c.cohortId) && !c.recordingUrl && addMinutes(c.startsAt, c.durationMinutes) < now && c.startsAt > new Date(now.getTime() - 21 * 86400000),
  );
  const soon = new Date(now.getTime() + 14 * 86400000);
  const noMeetLink = classRows.filter((c) => !selfPacedIds.has(c.cohortId) && c.startsAt > now && c.startsAt < soon && !c.meetUrl && !cohortOf(c.cohortId).meetUrl);
  const unpaid = enrolmentRows.filter((e) => e.status === "pending");

  const upcoming = classRows
    .filter((c) => !selfPacedIds.has(c.cohortId) && addMinutes(c.startsAt, c.durationMinutes) > now)
    .slice(0, 5)
    .map((c) => ({ ...c, cohort: cohortOf(c.cohortId), course: courseOfCohort(c.cohortId) }));

  const activity: Activity[] = [
    ...paid.map((p) => {
      const e = enrolmentById.get(p.enrolmentId)!;
      return { at: p.paidAt!, kind: "payment" as const, text: `${userName(e.userId)} enrolled in ${courseOfCohort(e.cohortId).title}`, href: "/teach/payments" };
    }),
    ...submissionRows.map((s) => ({
      at: s.submittedAt,
      kind: "submission" as const,
      text: `${userName(s.userId)} handed in "${assignmentRows.find((a) => a.id === s.assignmentId)?.title ?? "an assignment"}"`,
      href: "/teach/marking",
    })),
    ...liveCertificates.map((c) => ({ at: c.issuedAt, kind: "certificate" as const, text: `${c.studentName} earned the ${c.courseTitle} certificate`, href: `/verify/${c.code}` })),
    ...questionRows.map((q) => ({ at: q.createdAt, kind: "question" as const, text: `${userName(q.userId)} asked the tutor: "${q.content.slice(0, 80)}${q.content.length > 80 ? "…" : ""}"`, href: "/teach/tutor" })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return {
    incomeThisMonthKobo: incomeByMonth[5].kobo,
    incomeLastMonthKobo: incomeByMonth[4].kobo,
    totalIncomeKobo: paid.reduce((sum, p) => sum + p.amountKobo, 0),
    incomeByMonth,
    activeStudents: new Set(active.map((e) => e.userId)).size,
    newStudents,
    certificates: liveCertificates.length,
    toMark,
    missingVideos,
    missingRecordings,
    noMeetLink,
    unpaid,
    upcoming,
    byCourse,
    activity,
  };
}

export async function courseWithCohorts(db: Database) {
  const rows = await db.query.courses.findMany({ orderBy: asc(courses.sortOrder) });
  return Promise.all(
    rows.map(async (course) => {
      const list = await db.query.cohorts.findMany({ where: eq(cohorts.courseId, course.id), orderBy: [desc(cohorts.selfPaced), desc(cohorts.startsAt)] });
      return {
        course,
        cohorts: await Promise.all(
          list.map(async (c) => ({
            ...c,
            students: (await db.query.enrolments.findMany({ where: and(eq(enrolments.cohortId, c.id), eq(enrolments.status, "active")) })).length,
          })),
        ),
      };
    }),
  );
}
