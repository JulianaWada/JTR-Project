import Link from "next/link";
import { redirect } from "next/navigation";
import { PageTitle, Panel, Pill, Table, Td, humanise, inputClass, secondaryButtonClass } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { AUDIT_PAGE_SIZE, auditActions, auditActors, listAudit, type AuditAction } from "@/lib/admin/audit";
import { formatDateTime } from "@/lib/admin/money";
import { can, roleInfo, type Role } from "@/lib/admin/roles";

export const metadata = { title: "Audit trail" };

const periods = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "", label: "All time" },
];

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
}

function tone(action: string) {
  if (action === "login.failed" || action === "permission.denied" || action === "team.disabled") return "red" as const;
  if (action.startsWith("login") || action === "logout") return "neutral" as const;
  if (action.startsWith("team") || action.startsWith("account")) return "blue" as const;
  if (action === "export.download") return "amber" as const;
  return "green" as const;
}

/** A short line for the details saved with each entry. */
function describe(action: string, details: Record<string, unknown> | null) {
  if (!details) return null;
  const d = details as Record<string, string | number | boolean | undefined>;
  if ("from" in d && "to" in d) {
    const label = (v: unknown) => (typeof v === "string" && v in roleInfo ? roleInfo[v as Role].label : humanise(String(v)));
    return `${label(d.from)} → ${label(d.to)}`;
  }
  if (action === "project.update") {
    return [d.hidden ? "Hidden" : "Shown on site", d.featured ? "on home page" : null, d.status === "live" ? "Live" : "In progress", d.href ? `link ${d.href}` : "no link"]
      .filter(Boolean)
      .join(" · ");
  }
  if (action === "project.move") return `Moved ${d.direction} to position ${d.position}`;
  if (action === "export.download") return `${d.rows} rows`;
  if (action === "team.added") return `As ${roleInfo[d.role as Role]?.label ?? d.role}`;
  if (action === "login.failed") return d.reason === "disabled" ? "Login is turned off" : d.reason === "closed" ? "Board closed" : "Wrong email or password";
  if (action === "permission.denied") return `Needs ${d.permission}`;
  if (action === "whatsapp.business_added") return `/${d.slug} · ${d.kind}`;
  return null;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdmin();
  if (!can(session.role, "audit.view")) redirect("/admin");
  const params = await searchParams;
  const filter = {
    action: first(params.action),
    actor: first(params.who),
    days: Number(first(params.days) ?? "") || undefined,
    page: Number(first(params.page) ?? "") || 1,
  };
  const [{ rows, total, page }, actors] = await Promise.all([listAudit(filter), auditActors()]);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const pageLink = (p: number) => {
    const q = new URLSearchParams();
    if (filter.action) q.set("action", filter.action);
    if (filter.actor) q.set("who", filter.actor);
    if (filter.days) q.set("days", String(filter.days));
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `/admin/audit${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageTitle
        title="Audit trail"
        subtitle="Every sign-in and every change made on this admin board: who, what and when (Lagos time). Entries can't be edited or deleted. Changes made inside the academy or WhatsApp agent apps are not listed here."
      />

      <Panel>
        <form method="get" className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_12rem_auto] lg:items-end">
          <div>
            <label htmlFor="who" className="mb-1.5 block text-sm font-semibold text-ink">
              Who
            </label>
            <select id="who" name="who" defaultValue={filter.actor ?? ""} className={inputClass}>
              <option value="">Everyone</option>
              {actors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="action" className="mb-1.5 block text-sm font-semibold text-ink">
              What
            </label>
            <select id="action" name="action" defaultValue={filter.action ?? ""} className={inputClass}>
              <option value="">Everything</option>
              {Object.entries(auditActions).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="days" className="mb-1.5 block text-sm font-semibold text-ink">
              When
            </label>
            <select id="days" name="days" defaultValue={filter.days ? String(filter.days) : ""} className={inputClass}>
              {periods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className={secondaryButtonClass}>
              Filter
            </button>
            {(filter.action || filter.actor || filter.days) && (
              <Link href="/admin/audit" className="inline-flex h-10 items-center px-2 text-sm font-semibold text-muted hover:text-ink">
                Clear
              </Link>
            )}
          </div>
        </form>
      </Panel>

      <Panel title={`${total} ${total === 1 ? "entry" : "entries"}`} subtitle={pages > 1 ? `Page ${page} of ${pages}` : undefined}>
        <Table head={["When", "Who", "What", "Details"]} empty="Nothing recorded yet for this filter.">
          {rows.map((r) => (
            <tr key={r.id}>
              <Td className="whitespace-nowrap text-muted">{formatDateTime(r.at)}</Td>
              <Td>
                <p className="font-semibold text-ink">{r.actorName}</p>
                <p className="text-xs text-muted">
                  {r.actorRole in roleInfo ? roleInfo[r.actorRole as Role].label : "Not signed in"}
                  {r.actorEmail && r.actorEmail !== r.actorName ? ` · ${r.actorEmail}` : ""}
                </p>
              </Td>
              <Td>
                <Pill tone={tone(r.action)}>{auditActions[r.action as AuditAction] ?? r.action}</Pill>
                {r.target && <p className="mt-1 text-ink">{r.target}</p>}
              </Td>
              <Td className="text-muted">
                {describe(r.action, r.details)}
                {r.ip && r.ip !== "unknown" && <p className="mt-0.5 text-xs text-muted/80">IP {r.ip}</p>}
              </Td>
            </tr>
          ))}
        </Table>
        {pages > 1 && (
          <nav aria-label="Pages" className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            {page > 1 ? (
              <Link href={pageLink(page - 1)} className="font-semibold text-primary">
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            {page < pages && (
              <Link href={pageLink(page + 1)} className="font-semibold text-primary">
                Older →
              </Link>
            )}
          </nav>
        )}
      </Panel>
    </>
  );
}
