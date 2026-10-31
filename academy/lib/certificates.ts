import { and, eq } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "@/lib/db";
import { certificates, cohorts, courses, users } from "@/lib/db/schema";
import { awardBadges } from "@/lib/badges";
import { sendEmail } from "@/lib/email";
import { url } from "@/lib/env";
import { shortCode } from "@/lib/money";
import { getProgress } from "@/lib/progress";
import { formatDate } from "@/lib/time";

/** Issues (or re-activates) the certificate. `force` lets the teacher issue one outside the rule. */
export async function issueCertificate(db: Database, userId: string, cohortId: string, opts: { force?: boolean } = {}) {
  const existing = await db.query.certificates.findFirst({ where: and(eq(certificates.userId, userId), eq(certificates.cohortId, cohortId)) });
  if (existing && !existing.revokedAt) return existing;
  if (!opts.force && !(await getProgress(db, userId, cohortId)).eligible) return null;

  const user = (await db.query.users.findFirst({ where: eq(users.id, userId) }))!;
  const cohort = (await db.query.cohorts.findFirst({ where: eq(cohorts.id, cohortId) }))!;
  const course = (await db.query.courses.findFirst({ where: eq(courses.id, cohort.courseId) }))!;

  let certificate;
  if (existing) {
    [certificate] = await db
      .update(certificates)
      .set({ revokedAt: null, issuedAt: new Date(), studentName: user.name, courseTitle: course.title })
      .where(eq(certificates.code, existing.code))
      .returning();
  } else {
    [certificate] = await db
      .insert(certificates)
      .values({ code: shortCode("JTR"), userId, cohortId, studentName: user.name, courseTitle: course.title })
      .returning();
  }
  await awardBadges(db, userId, cohortId);
  await sendEmail(db, {
    to: user.email,
    subject: `Your certificate: ${course.title}`,
    body: [
      `Congratulations ${user.name}!`,
      "",
      `You have completed ${course.title} at JTR Academy.`,
      `Download your certificate: ${url(`/certificates/${certificate.code}/pdf`)}`,
      `Anyone can check it here: ${url(`/verify/${certificate.code}`)}`,
      "",
      "Share it on LinkedIn and tag Jules TechRight.",
    ].join("\n"),
  });
  return certificate;
}

export async function revokeCertificate(db: Database, code: string) {
  await db.update(certificates).set({ revokedAt: new Date() }).where(eq(certificates.code, code));
}

/** Issues the certificate if the student now meets the rule. Call after attendance or marking changes. */
export async function checkCompletion(db: Database, userId: string, cohortId: string) {
  const progress = await getProgress(db, userId, cohortId);
  if (progress.eligible && !progress.certificateCode) await issueCertificate(db, userId, cohortId);
  else await awardBadges(db, userId, cohortId, progress);
}

let emblem: Uint8Array | null = null;

/** An A4 landscape certificate. */
export async function certificatePdf(cert: { code: string; studentName: string; courseTitle: string; issuedAt: Date }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${cert.courseTitle} certificate: ${cert.studentName}`);
  pdf.setAuthor("JTR Academy, Jules TechRight Ltd");
  const page = pdf.addPage([842, 595]);
  const { width, height } = page.getSize();
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(10 / 255, 26 / 255, 51 / 255);
  const blue = rgb(21 / 255, 99 / 255, 214 / 255);
  const muted = rgb(75 / 255, 90 / 255, 110 / 255);
  const silver = rgb(197 / 255, 204 / 255, 214 / 255);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: navy, borderWidth: 3 });
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: silver, borderWidth: 1 });
  page.drawRectangle({ x: 24, y: height - 30, width: width - 48, height: 6, color: blue });

  const center = (text: string, size: number, font: typeof sans, y: number, color = navy) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  emblem ??= new Uint8Array(await readFile(path.join(process.cwd(), "public/brand/jtr-emblem.png")));
  const image = await pdf.embedPng(emblem);
  page.drawImage(image, { x: width / 2 - 36, y: height - 140, width: 72, height: 72 });

  center("JTR ACADEMY", 14, sansBold, height - 165, blue);
  center("Certificate of Completion", 36, serif, height - 215);
  center("This certifies that", 13, sans, height - 255, muted);
  let nameSize = 34;
  while (serif.widthOfTextAtSize(cert.studentName, nameSize) > width - 160 && nameSize > 18) nameSize -= 2;
  center(cert.studentName, nameSize, serif, height - 300);
  page.drawLine({ start: { x: width / 2 - 180, y: height - 312 }, end: { x: width / 2 + 180, y: height - 312 }, color: silver, thickness: 1 });
  center("has successfully completed the course", 13, sans, height - 340, muted);
  center(cert.courseTitle, 22, sansBold, height - 372);
  center("including all lessons, assignments and a final project", 11, sans, height - 395, muted);

  page.drawText("Jules", { x: 120, y: 120, size: 24, font: serif, color: navy });
  page.drawLine({ start: { x: 110, y: 110 }, end: { x: 300, y: 110 }, color: silver, thickness: 1 });
  page.drawText("Jules, Lead Instructor", { x: 110, y: 94, size: 10, font: sans, color: muted });
  page.drawText("Jules TechRight Ltd", { x: 110, y: 80, size: 10, font: sans, color: muted });

  const right = (text: string, size: number, font: typeof sans, y: number, color = muted) => {
    page.drawText(text, { x: width - 110 - font.widthOfTextAtSize(text, size), y, size, font, color });
  };
  right(`Issued ${formatDate(cert.issuedAt)}`, 10, sans, 120);
  right(`Certificate ID ${cert.code}`, 10, sansBold, 104, navy);
  right(`Verify at ${url(`/verify/${cert.code}`).replace(/^https?:\/\//, "")}`, 9, sans, 88);

  return pdf.save();
}
