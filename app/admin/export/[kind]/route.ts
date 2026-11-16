import { getAdminSession } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { can } from "@/lib/admin/roles";
import { listInterest, listLeads } from "@/lib/admin/site-data";
import { membersForExport, parseAudience, type MemberAudience } from "@/lib/admin/members-data";
import { unsubscribeUrl } from "@/lib/members/emails";

// CSV downloads of leads and Academy sign-ups, for spreadsheets or WhatsApp broadcast lists.

function csv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : v === null || v === undefined ? "" : String(v);
    // Leading = + - @ would be read as a formula by spreadsheet apps (phone numbers are fine as they are).
    const safe = /^[=+\-@]/.test(s) && !/^\+?[\d\s()-]+$/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
}

function withoutInternal(row: Record<string, unknown>) {
  const copy = { ...row };
  delete copy.id;
  delete copy.emailed;
  return copy;
}

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const session = await getAdminSession();
  if (!session) return new Response("Not signed in", { status: 401 });
  const { kind } = await params;
  if (!can(session.role, "export")) {
    await recordAudit(session, "permission.denied", `CSV: ${kind}`, { permission: "export" });
    return new Response("Your role doesn't allow downloads. Ask the super admin if you need it.", { status: 403 });
  }
  let rows: Record<string, unknown>[];
  let audience: MemberAudience = "all";
  if (kind === "leads") {
    rows = (await listLeads()).map(withoutInternal);
  } else if (kind === "interest") {
    rows = (await listInterest()).map(withoutInternal);
  } else if (kind === "members") {
    audience = parseAudience(new URL(request.url).searchParams.get("audience"));
    rows = (await membersForExport(audience)).map(({ unsubscribeToken, interests, ...m }) => ({
      name: m.name,
      email: m.email,
      phone: m.phone,
      interests: interests.join(" "),
      language: m.locale,
      email_opt_in: m.marketingEmail ? "yes" : "no",
      whatsapp_opt_in: m.marketingWhatsapp ? "yes" : "no",
      consent_updated_at: m.consentUpdatedAt,
      utm_source: m.utmSource,
      utm_medium: m.utmMedium,
      utm_campaign: m.utmCampaign,
      joined_at: m.createdAt,
      last_sign_in_at: m.lastLoginAt,
      unsubscribe_url: unsubscribeUrl(m.locale, unsubscribeToken),
    }));
  } else {
    return new Response("Not found", { status: 404 });
  }
  const label = kind === "leads" ? "Leads" : kind === "members" ? `Members (${audience})` : "Academy sign-ups";
  await recordAudit(session, "export.download", label, { rows: rows.length });
  const date = new Date().toISOString().slice(0, 10);
  const file = kind === "leads" ? "leads" : kind === "members" ? `members${audience === "all" ? "" : `-${audience}-opt-in`}` : "academy-signups";
  return new Response(`﻿${csv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jtr-${file}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
