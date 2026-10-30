import { isAdmin } from "@/lib/admin/auth";
import { listInterest, listLeads } from "@/lib/admin/site-data";

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

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await isAdmin())) return new Response("Not signed in", { status: 401 });
  const { kind } = await params;
  let rows: Record<string, unknown>[];
  if (kind === "leads") {
    rows = (await listLeads()).map(withoutInternal);
  } else if (kind === "interest") {
    rows = (await listInterest()).map(withoutInternal);
  } else {
    return new Response("Not found", { status: 404 });
  }
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jtr-${kind === "leads" ? "leads" : "academy-signups"}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
