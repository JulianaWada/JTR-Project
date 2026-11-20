import type { Database } from "@/lib/db";
import type { cohorts, courses, payments, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { url } from "@/lib/env";
import { money } from "@/lib/money";
import { TEACHER_EMAIL } from "@/lib/seed";
import { formatDateTime } from "@/lib/time";

type User = typeof users.$inferSelect;

/**
 * The inbox that gets the academy's alerts (new sign-ups, enrolments, teacher applications).
 * ADMIN_NOTIFY_EMAIL wins; without it the teacher login (TEACHER_EMAIL) is used, as before.
 */
export function adminNotifyEmail() {
  return (
    process.env.ADMIN_NOTIFY_EMAIL?.trim().toLowerCase() ||
    process.env.TEACHER_EMAIL?.trim().toLowerCase() ||
    TEACHER_EMAIL
  );
}

/** Sends an alert to the admin. Never throws: a failed alert must not stop a sign-up or an enrolment. */
async function alertAdmin(db: Database, subject: string, lines: string[]) {
  try {
    await sendEmail(db, { to: adminNotifyEmail(), subject, body: lines.filter((l) => l !== "").join("\n") });
  } catch (err) {
    console.error("[admin-alert] could not send", subject, err);
  }
}

export async function alertNewSignup(db: Database, user: User) {
  await alertAdmin(db, `New student sign-up: ${user.name}`, [
    `${user.name} just created a JTR Academy account.`,
    "",
    `Email: ${user.email}`,
    user.phone ? `Phone: ${user.phone}` : "",
    `Signed up: ${formatDateTime(user.createdAt)} (Lagos time)`,
    "",
    "They haven't paid for a course yet. You'll get another email if they enroll.",
  ]);
}

export async function alertNewEnrolment(
  db: Database,
  details: {
    user: User;
    course: typeof courses.$inferSelect;
    cohort: typeof cohorts.$inferSelect;
    payment: typeof payments.$inferSelect;
  },
) {
  const { user, course, cohort, payment } = details;
  const paid = money(payment.amountKobo, payment.currency);
  const discount = payment.discountCode
    ? ` (list price ${money(payment.listPriceKobo, payment.currency)}, code ${payment.discountCode})`
    : "";
  await alertAdmin(db, `New enrollment: ${user.name}, ${course.title} (${paid})`, [
    `${user.name} just enrolled in ${course.title}.`,
    "",
    `Student: ${user.name}`,
    `Email: ${user.email}`,
    user.phone ? `Phone: ${user.phone}` : "",
    `Course: ${course.title}`,
    `Intake: ${cohort.selfPaced ? "Recorded (self-paced)" : cohort.name}`,
    `Amount paid: ${paid}${discount}`,
    `Payment reference: ${payment.reference}${payment.provider === "test" ? " (practice payment, no real money)" : ""}`,
    "",
    `See your students: ${url("/teach")}`,
  ]);
}
