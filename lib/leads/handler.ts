import "server-only";
import { siteConfig } from "@/content/site";
import { getEmailProvider } from "@/lib/email";
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

/**
 * The single entry point for new leads, shared by the contact form API and the AI assistant.
 * Validates, filters spam and emails the team.
 */
export async function saveLead(input: LeadInput): Promise<SaveLeadResult> {
  // Honeypot filled in: pretend success so bots don't learn anything.
  if (input.website) return { ok: false, error: "spam" };

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", issues: parsed.error.flatten() };
  const lead = parsed.data;

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
    return { ok: true };
  } catch (err) {
    console.error("[leads] failed to send", err);
    return { ok: false, error: "send_failed" };
  }
}
