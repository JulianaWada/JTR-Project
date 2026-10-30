import "server-only";
import { eq } from "drizzle-orm";
import { siteConfig } from "@/content/site";
import { getEmailProvider } from "@/lib/email";
import { getDb, schema } from "@/lib/db";
import { leadSchema, type Lead, type LeadInput } from "./schema";

export type SaveLeadResult = { ok: true } | { ok: false; error: "invalid" | "spam" | "send_failed"; issues?: unknown };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function formatLead(lead: Lead) {
  const rows: [string, string | undefined][] = [
    ["Source", lead.source === "assistant" ? "JTR Assistant (AI chat)" : "Contact form"],
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Company", lead.company],
    ["Country", lead.country],
    ["Time zone", lead.timezone],
    ["Service", lead.service],
    ["Budget", lead.budget ? `${lead.budget} (${lead.currency ?? "USD"})` : undefined],
    ["Site language", lead.locale],
  ];
  const filled = rows.filter((r): r is [string, string] => Boolean(r[1]));
  const text = `${filled.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nMessage:\n${lead.message}`;
  const html = `<table cellpadding="6" style="font-family:sans-serif;font-size:14px">${filled
    .map(([k, v]) => `<tr><td style="color:#4b5a6e"><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`)
    .join("")}</table><p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(lead.message)}</p>`;
  return { text, html };
}

/** Saves the lead for the admin board. Returns the row id, or null if the database is unavailable. */
async function storeLead(lead: Lead): Promise<string | null> {
  try {
    const db = await getDb();
    const [row] = await db
      .insert(schema.leads)
      .values({
        source: lead.source,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || null,
        company: lead.company || null,
        country: lead.country || null,
        timezone: lead.timezone || null,
        service: lead.service ?? null,
        budget: lead.budget ?? null,
        currency: lead.currency ?? null,
        message: lead.message,
        locale: lead.locale,
      })
      .returning({ id: schema.leads.id });
    return row.id;
  } catch (err) {
    console.error("[leads] failed to save", err);
    return null;
  }
}

/**
 * The single entry point for new leads, shared by the contact form API and the AI assistant.
 * Validates, filters spam, saves the lead (it shows up in /admin) and emails the team.
 * Once the lead is saved, a failed email no longer fails the request.
 */
export async function saveLead(input: LeadInput): Promise<SaveLeadResult> {
  // Honeypot filled in: pretend success so bots don't learn anything.
  if (input.website) return { ok: false, error: "spam" };

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", issues: parsed.error.flatten() };
  const lead = parsed.data;

  const id = await storeLead(lead);
  const { text, html } = formatLead(lead);
  try {
    await getEmailProvider().send({
      // TODO: set LEADS_TO_EMAIL to the inbox that should receive new enquiries.
      to: process.env.LEADS_TO_EMAIL ?? siteConfig.contact.email,
      replyTo: lead.email,
      subject: `New ${lead.source === "assistant" ? "AI assistant" : "website"} enquiry from ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
      text,
      html,
    });
    if (id) await markEmailed(id);
    return { ok: true };
  } catch (err) {
    console.error("[leads] failed to send", err);
    return id ? { ok: true } : { ok: false, error: "send_failed" };
  }
}

async function markEmailed(id: string) {
  try {
    const db = await getDb();
    await db.update(schema.leads).set({ emailed: true }).where(eq(schema.leads.id, id));
  } catch (err) {
    console.error("[leads] failed to mark as emailed", err);
  }
}
