import "server-only";
import { eq } from "drizzle-orm";
import { siteConfig } from "@/content/site";
import { getEmailProvider } from "@/lib/email";
import { getDb, schema } from "@/lib/db";
import { academyInterestSchema, type AcademyInterest, type AcademyInterestInput } from "./interest-schema";

export type SaveInterestResult = { ok: true } | { ok: false; error: "invalid" | "spam" | "send_failed"; issues?: unknown };

const courseNames: Record<AcademyInterest["course"], string> = {
  sales: "Boost Sales with AI",
  animation: "Create Animation Videos with AI",
  both: "Both courses",
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function formatInterest(entry: AcademyInterest) {
  const rows: [string, string | undefined][] = [
    ["Name", entry.name],
    ["Phone / WhatsApp", entry.phone],
    ["Email", entry.email],
    ["Course", courseNames[entry.course]],
    ["Location", entry.location],
    ["Heard about us via", entry.heardFrom],
    ["Site language", entry.locale],
  ];
  const filled = rows.filter((r): r is [string, string] => Boolean(r[1]));
  const text = filled.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table cellpadding="6" style="font-family:sans-serif;font-size:14px">${filled
    .map(([k, v]) => `<tr><td style="color:#4b5a6e"><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`)
    .join("")}</table>`;
  return { text, html };
}

/** Saves the registration for the admin board. Returns the row id, or null if the database is unavailable. */
async function storeInterest(entry: AcademyInterest): Promise<string | null> {
  try {
    const db = await getDb();
    const [row] = await db
      .insert(schema.academyInterest)
      .values({
        name: entry.name,
        phone: entry.phone,
        email: entry.email || null,
        course: entry.course,
        location: entry.location || null,
        heardFrom: entry.heardFrom ?? null,
        locale: entry.locale,
        consent: entry.consent === true,
      })
      .returning({ id: schema.academyInterest.id });
    return row.id;
  } catch (err) {
    console.error("[academy-interest] failed to save", err);
    return null;
  }
}

/**
 * Validates an Academy interest registration, filters spam, saves it (it shows up in /admin/academy)
 * and emails the team. Once the entry is saved, a failed email no longer fails the request.
 */
export async function saveAcademyInterest(input: AcademyInterestInput): Promise<SaveInterestResult> {
  if (input.website) return { ok: false, error: "spam" };

  const parsed = academyInterestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", issues: parsed.error.flatten() };
  const entry = parsed.data;

  const id = await storeInterest(entry);
  const { text, html } = formatInterest(entry);
  try {
    await getEmailProvider().send({
      // Same inbox as website enquiries unless ACADEMY_TO_EMAIL is set.
      to: process.env.ACADEMY_TO_EMAIL ?? process.env.LEADS_TO_EMAIL ?? siteConfig.contact.email,
      replyTo: entry.email || undefined,
      subject: `JTR Academy interest: ${entry.name} (${courseNames[entry.course]})`,
      text,
      html,
    });
    if (id) {
      const db = await getDb();
      await db.update(schema.academyInterest).set({ emailed: true }).where(eq(schema.academyInterest.id, id)).catch(() => {});
    }
    return { ok: true };
  } catch (err) {
    console.error("[academy-interest] failed to send", err);
    return id ? { ok: true } : { ok: false, error: "send_failed" };
  }
}
