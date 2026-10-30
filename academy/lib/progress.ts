import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { assignments, attendance, certificates, classes, cohorts, courses, quizAttempts, quizzes, submissions } from "@/lib/db/schema";

export type Progress = {
  totalClasses: number;
  heldClasses: number;
  attended: number;
  attendancePercent: number;
  requiredAttendancePercent: number;
  totalAssignments: number;
  submitted: number;
  passed: number;
  requiresFinalProject: boolean;
  finalProjectPassed: boolean;
  quizzesTaken: number;
  totalQuizzes: number;
  perfectQuizzes: number;
  certificateCode: string | null;
  /** Meets the course's completion rule. */
  eligible: boolean;
  /** 0 to 100, a single number for progress bars. */
  overallPercent: number;
};

export async function getProgress(db: Database, userId: string, cohortId: string, now = new Date()): Promise<Progress> {
  const cohort = (await db.query.cohorts.findFirst({ where: eq(cohorts.id, cohortId) }))!;
  const course = (await db.query.courses.findFirst({ where: eq(courses.id, cohort.courseId) }))!;
  const cohortClasses = await db.query.classes.findMany({ where: eq(classes.cohortId, cohortId) });
  const classIds = cohortClasses.map((c) => c.id);
  const attendedRows = classIds.length
    ? await db.query.attendance.findMany({ where: and(eq(attendance.userId, userId), inArray(attendance.classId, classIds)) })
    : [];
  const courseAssignments = await db.query.assignments.findMany({ where: eq(assignments.courseId, course.id) });
  const mySubmissions = await db.query.submissions.findMany({ where: and(eq(submissions.userId, userId), eq(submissions.cohortId, cohortId)) });
  const courseQuizzes = await db.query.quizzes.findMany({ where: eq(quizzes.courseId, course.id) });
  const attempts = courseQuizzes.length
    ? await db.query.quizAttempts.findMany({
        where: and(eq(quizAttempts.userId, userId), inArray(quizAttempts.quizId, courseQuizzes.map((q) => q.id))),
      })
    : [];
  const certificate = await db.query.certificates.findFirst({
    where: and(eq(certificates.userId, userId), eq(certificates.cohortId, cohortId)),
  });

  const finalIds = new Set(courseAssignments.filter((a) => a.isFinalProject).map((a) => a.id));
  const finalProjectPassed = mySubmissions.some((s) => finalIds.has(s.assignmentId) && s.grade === "pass");
  const totalClasses = cohortClasses.length;
  const attended = attendedRows.length;
  const attendancePercent = totalClasses ? Math.round((attended / totalClasses) * 100) : 0;
  const required = course.completionAttendancePercent;
  const meetsAttendance = totalClasses > 0 && attended * 100 >= required * totalClasses;
  const meetsProject = !course.requiresFinalProject || finalIds.size === 0 || finalProjectPassed;
  const takenQuizIds = new Set(attempts.map((a) => a.quizId));
  const perfect = new Set(attempts.filter((a) => a.total > 0 && a.score === a.total).map((a) => a.quizId));
  const totalAssignments = courseAssignments.length;
  const passed = mySubmissions.filter((s) => s.grade === "pass").length;

  // Attendance counts for most of the bar; assignments for the rest.
  const overall = totalClasses
    ? Math.round(70 * Math.min(1, attended / totalClasses) + (totalAssignments ? 30 * (passed / totalAssignments) : 30))
    : 0;

  return {
    totalClasses,
    heldClasses: cohortClasses.filter((c) => c.startsAt < now).length,
    attended,
    attendancePercent,
    requiredAttendancePercent: required,
    totalAssignments,
    submitted: mySubmissions.length,
    passed,
    requiresFinalProject: course.requiresFinalProject && finalIds.size > 0,
    finalProjectPassed,
    quizzesTaken: takenQuizIds.size,
    totalQuizzes: courseQuizzes.length,
    perfectQuizzes: perfect.size,
    certificateCode: certificate && !certificate.revokedAt ? certificate.code : null,
    eligible: meetsAttendance && meetsProject,
    overallPercent: certificate && !certificate.revokedAt ? 100 : Math.min(overall, 99),
  };
}
