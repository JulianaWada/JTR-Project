import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { teacherProfiles, users, type TeacherStatus } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { url } from "@/lib/env";
import { TEACHER_EMAIL } from "@/lib/seed";

// Becoming a teacher: anyone can apply; the admin approves. Approval turns the account into a teacher account,
// which opens the teacher dashboard. Rejecting or suspending turns it back into a student account (their own
// learning keeps working). The admin's account is never changed here.

export type Application = { brandName: string; headline: string; subjects: string; website: string; bio: string };

export function cleanApplication(form: FormData): Application | { error: string } {
  const get = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const app = {
    brandName: get("brandName", 80),
    headline: get("headline", 120),
    subjects: get("subjects", 1000),
    website: get("website", 200),
    bio: get("bio", 2000),
  };
  if (app.subjects.length < 10) return { error: "Tell us what you'd like to teach (a sentence or two)." };
  if (app.website && !/^https?:\/\/\S+\.\S+/i.test(app.website)) {
    if (/^\S+\.\S+$/.test(app.website)) app.website = `https://${app.website}`;
    else return { error: "The website or social link doesn't look right. Paste the full address, or leave it empty." };
  }
  return app;
}

/** Saves (or re-sends) an application for `userId` and tells the admin. Teachers and the admin can't apply. */
export async function applyAsTeacher(db: Database, userId: string, app: Application, now = new Date()) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return { error: "Please log in again." };
  if (user.role === "teacher") return { error: "You're already a teacher." };
  const existing = await db.query.teacherProfiles.findFirst({ where: eq(teacherProfiles.userId, userId) });
  if (existing?.status === "pending") return { error: "Your application is already waiting for approval." };
  if (existing?.status === "suspended") return { error: "Your teacher account is suspended. Please contact JTR." };
  const values = { ...app, status: "pending" as const, appliedAt: now, reviewedAt: null, adminNote: "" };
  if (existing) await db.update(teacherProfiles).set(values).where(eq(teacherProfiles.userId, userId));
  else await db.insert(teacherProfiles).values({ userId, ...values });

  const adminEmail = process.env.TEACHER_EMAIL?.trim().toLowerCase() || TEACHER_EMAIL;
  await sendEmail(db, {
    to: adminEmail,
    subject: `New teacher application: ${app.brandName || user.name}`,
    body: [
      `${user.name} (${user.email}) has applied to teach on JTR Academy.`,
      "",
      `What they want to teach: ${app.subjects}`,
      app.website ? `Website or social: ${app.website}` : "",
      "",
      `Approve or decline: ${url("/teach/teachers")}`,
    ]
      .filter((l) => l !== "")
      .join("\n"),
  });
  return { ok: true as const };
}

export type Review = "approve" | "reject" | "suspend";

const NEXT_STATUS: Record<Review, TeacherStatus> = { approve: "approved", reject: "rejected", suspend: "suspended" };

/** The admin's decision on a teacher. Emails the teacher. */
export async function reviewTeacher(db: Database, userId: string, decision: Review, note = "", now = new Date()) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const profile = await db.query.teacherProfiles.findFirst({ where: eq(teacherProfiles.userId, userId) });
  if (!user || !profile) return { error: "Teacher not found." };
  if (user.isAdmin) return { error: "That's the admin account." };
  const status = NEXT_STATUS[decision];
  await db.update(teacherProfiles).set({ status, reviewedAt: now, adminNote: note.trim().slice(0, 1000) }).where(eq(teacherProfiles.userId, userId));
  await db.update(users).set({ role: status === "approved" ? "teacher" : "student" }).where(eq(users.id, userId));

  const first = user.name.split(" ")[0];
  const message =
    status === "approved"
      ? {
          subject: "You're approved to teach on JTR Academy",
          lines: [
            "Good news: your teacher account is approved.",
            "",
            "Log in to open your teacher dashboard. Start with your profile (logo, photo and bio), then create your first course.",
            "Courses start as drafts; publish them when they're ready.",
            "",
            url("/teach"),
          ],
        }
      : status === "rejected"
        ? {
            subject: "Your JTR Academy teacher application",
            lines: ["Thank you for applying to teach on JTR Academy. We can't approve your application right now.", note ? `\n${note}` : "", "", "You can update it and apply again any time:", url("/teach-with-us")],
          }
        : {
            subject: "Your JTR Academy teacher account is suspended",
            lines: ["Your teacher dashboard has been turned off for now.", note ? `\n${note}` : "", "", "Please reply to this email if you have questions."],
          };
  await sendEmail(db, { to: user.email, subject: message.subject, body: [`Hi ${first},`, "", ...message.lines.filter((l) => l !== ""), "", "JTR Academy"].join("\n") });
  return { ok: true as const, status };
}
