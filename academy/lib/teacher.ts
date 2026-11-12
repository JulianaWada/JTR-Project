import { needsLink } from "@/lib/class-room";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { certificates, classes, cohorts, courses, enrolments, submissions, tutorMessages } from "@/lib/db/schema";
import { ownCourses, type Staff } from "@/lib/teachers";
import { addMinutes } from "@/lib/time";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type Activity = { at: Date; kind: "payment" | "submission" | "certificate" | "question"; text: string; href: string };

/** Everything the teacher overview shows, in one pass over the (small) academy tables. */
export async function teacherDashboard(db: Database, teacher: Staff, now = new Date()) {
  // One query at a time: Supabase's pooler allows only a few connections per server instance.
  // Each teacher only sees their own courses and everything under them; the admin sees the whole academy.
  const courseRows = await db.query.courses.findMany({ where: ownCourses(teacher), orderBy: asc(courses.sortOrder) });
  const courseIds = new Set(courseRows.map((c) => c.id));
  const cohortRows = (await db.query.cohorts.findMany()).filter((c) => courseIds.has(c.courseId));
  const cohortIds = new Set(cohortRows.map((c) => c.id));
  const enrolmentRows = (await db.query.enrolments.findMany()).filter((e) => cohortIds.has(e.cohortId));
  const enrolmentIds = new Set(enrolmentRows.map((e) => e.id));
  const paymentRows = (await db.query.payments.findMany()).filter((p) => enrolmentIds.has(p.enrolmentId));
  const submissionRows = (await db.query.submissions.findMany({ orderBy: desc(submissions.submittedAt) })).filter((s) => cohortIds.has(s.cohortId));
  const certificateRows = (await db.query.certificates.findMany({ orderBy: desc(certificates.issuedAt) })).filter((c) => cohortIds.has(c.cohortId));
  const questionRows = (await db.query.tutorMessages.findMany({ where: eq(tutorMessages.role, "user"), orderBy: desc(tutorMessages.createdAt), limit: 200 }))
    .filter((q) => cohortIds.has(q.cohortId))
    .slice(0, 10);
  const classRows = (await db.query.classes.findMany({ orderBy: asc(classes.startsAt) })).filter((c) => cohortIds.has(c.cohortId));
  const userRows = await db.query.users.findMany();
  const assignmentRows = await db.query.assignments.findMany();
  const userName = (id: string) => userRows.find((u) => u.id === id)?.name ?? "A student";
  const cohortOf = (id: string) => cohortRows.find((c) => c.id === id);
  const courseOfCohort = (id: string) => courseRows.find((c) => c.id === cohortOf(id)?.courseId);
  const enrolmentById = new Map(enrolmentRows.map((e) => [e.id, e]));

  // Naira and dollar payments can't be added together: the income figures are naira, dollars are totalled separately.
  const paidAny = paymentRows.filter((p) => p.status === "success" && p.paidAt);
  const paid = paidAny.filter((p) => p.currency === "NGN");
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
  const missingVideos = classRows.filter((c) => selfPacedIds.has(c.cohortId) && !c.recordingUrl && courseOfCohort(c.cohortId)?.format === "recorded");
  const missingRecordings = classRows.filter(
    (c) => !selfPacedIds.has(c.cohortId) && !c.recordingUrl && addMinutes(c.startsAt, c.durationMinutes) < now && c.startsAt > new Date(now.getTime() - 21 * 86400000),
  );
  const soon = new Date(now.getTime() + 14 * 86400000);
  const noMeetLink = classRows.filter((c) => !selfPacedIds.has(c.cohortId) && c.startsAt > now && c.startsAt < soon && !c.meetUrl && !!cohortOf(c.cohortId) && needsLink(cohortOf(c.cohortId)!));
  const unpaid = enrolmentRows.filter((e) => e.status === "pending");

  const upcoming = classRows
    .filter((c) => !selfPacedIds.has(c.cohortId) && addMinutes(c.startsAt, c.durationMinutes) > now)
    .flatMap((c) => {
      const cohort = cohortOf(c.cohortId);
      const course = courseOfCohort(c.cohortId);
      return cohort && course ? [{ ...c, cohort, course }] : [];
    })
    .slice(0, 5);

  const activity: Activity[] = [
    ...paidAny.flatMap((p) => {
      const e = enrolmentById.get(p.enrolmentId);
      if (!e) return [];
      return [{ at: p.paidAt!, kind: "payment" as const, text: `${userName(e.userId)} enrolled in ${courseOfCohort(e.cohortId)?.title ?? "a course"}`, href: "/teach/payments" }];
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
    totalIncomeUsdCents: paidAny.filter((p) => p.currency === "USD").reduce((sum, p) => sum + p.amountKobo, 0),
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

export async function courseWithCohorts(db: Database, teacher: Staff) {
  const rows = await db.query.courses.findMany({ where: ownCourses(teacher), orderBy: asc(courses.sortOrder) });
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
