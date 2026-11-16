import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { PageTitle, Panel, Pill, Stat, Table, Td, inputClass, secondaryButtonClass } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/admin/money";
import { listMembers, memberCounts, membersByCampaign, parseAudience, type MemberAudience } from "@/lib/admin/members-data";
import { localeNames, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import en from "@/messages/en.json";

export const metadata = { title: "Members" };

const interestNames = en.account.interests as Record<string, string>;

const audiences: { value: MemberAudience; label: string }[] = [
  { value: "all", label: "All" },
  { value: "email", label: "Email opt-in" },
  { value: "whatsapp", label: "WhatsApp opt-in" },
];

function href(audience: MemberAudience, q?: string) {
  const params = new URLSearchParams();
  if (audience !== "all") params.set("audience", audience);
  if (q) params.set("q", q);
  const s = params.toString();
  return s ? `/admin/members?${s}` : "/admin/members";
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const audience = parseAudience(params.audience);
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const [members, counts, campaigns, session] = await Promise.all([listMembers({ audience, q }), memberCounts(), membersByCampaign(), requireAdmin()]);
  const canExport = can(session.role, "export");

  return (
    <>
      <PageTitle
        title="Members"
        subtitle={
          <>
            People who created an account on the website at{" "}
            <Link href="/en/account/signup" className="font-semibold text-primary">
              /account/signup
            </Link>
            . Only send marketing to people who opted in to that channel.
          </>
        }
        actions={
          canExport ? (
            <a href={`/admin/export/members${audience !== "all" ? `?audience=${audience}` : ""}`} download className="text-sm font-semibold text-primary">
              Download CSV{audience !== "all" ? ` (${audiences.find((a) => a.value === audience)?.label})` : ""}
            </a>
          ) : undefined
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Members" value={counts.all} note={`${counts.week} joined in the last 7 days`} icon="users" tone="blue" />
        <Stat label="Email opt-in" value={counts.email} note="Can get marketing emails" href={href("email")} icon="mail" tone="green" />
        <Stat label="WhatsApp opt-in" value={counts.whatsapp} note="Can get WhatsApp broadcasts" href={href("whatsapp")} icon="whatsapp" tone="violet" />
        <Stat
          label="From campaigns"
          value={campaigns.reduce((n, c) => n + c.n, 0)}
          note="Joined from a link with utm_ tags"
          icon="target"
          tone="amber"
        />
      </div>

      {campaigns.length > 0 && (
        <Panel title="Sign-ups by campaign" subtitle="From ?utm_source= and ?utm_campaign= on the links you share">
          <Table head={["Campaign", "Source", "Members"]} compact>
            {campaigns.map((c) => (
              <tr key={`${c.campaign}-${c.source}`}>
                <Td className="font-semibold text-ink">{c.campaign ?? "—"}</Td>
                <Td className="text-muted">{c.source ?? "—"}</Td>
                <Td className="tabular-nums">{c.n}</Td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}

      <Panel
        title={`${members.length} ${members.length === 1 ? "member" : "members"}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <form action="/admin/members" className="flex gap-2">
              {audience !== "all" && <input type="hidden" name="audience" value={audience} />}
              <input name="q" defaultValue={q} placeholder="Search name, email or phone" aria-label="Search members" className={cn(inputClass, "h-9 w-56")} />
              <button type="submit" className={cn(secondaryButtonClass, "h-9 px-4")}>
                Search
              </button>
            </form>
            <div className="flex gap-1">
              {audiences.map((a) => (
                <Link
                  key={a.value}
                  href={href(a.value, q)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap",
                    audience === a.value ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        }
      >
        <Table head={["Joined", "Member", "Interests", "Marketing", "Came from", "Last sign-in"]} empty={q ? "No members match this search." : "No members here yet."}>
          {members.map((m) => (
            <tr key={m.id}>
              <Td className="whitespace-nowrap text-muted">{formatDateTime(m.createdAt)}</Td>
              <Td>
                <p className="font-semibold text-ink">{m.name}</p>
                <a href={`mailto:${m.email}`} className="block text-muted hover:text-primary">
                  {m.email}
                </a>
                {m.phone && (
                  <a href={`https://wa.me/${m.phone.replace(/\D/g, "")}`} className="block text-primary">
                    {m.phone}
                  </a>
                )}
                <p className="mt-0.5 text-xs text-muted">{localeNames[m.locale as Locale] ?? m.locale}</p>
              </Td>
              <Td>
                <div className="flex max-w-[16rem] flex-wrap gap-1">
                  {m.interests.length ? m.interests.map((i) => <Pill key={i}>{interestNames[i] ?? i}</Pill>) : <span className="text-muted">—</span>}
                </div>
              </Td>
              <Td>
                <div className="flex flex-col items-start gap-1">
                  <Pill tone={m.marketingEmail ? "green" : "neutral"}>Email {m.marketingEmail ? "yes" : "no"}</Pill>
                  <Pill tone={m.marketingWhatsapp ? "green" : "neutral"}>WhatsApp {m.marketingWhatsapp ? "yes" : "no"}</Pill>
                  {m.consentUpdatedAt && <span className="text-xs text-muted">since {formatDateTime(m.consentUpdatedAt)}</span>}
                </div>
              </Td>
              <Td className="text-muted">
                {m.utmCampaign || m.utmSource ? (
                  <>
                    {m.utmCampaign && <p className="font-semibold text-ink">{m.utmCampaign}</p>}
                    <p>{[m.utmSource, m.utmMedium].filter(Boolean).join(" · ")}</p>
                  </>
                ) : (
                  "Website"
                )}
              </Td>
              <Td className="whitespace-nowrap text-muted">{m.lastLoginAt ? formatDateTime(m.lastLoginAt) : "—"}</Td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel title="Running a campaign" subtitle="How to use this list">
        <ul className="list-disc space-y-1.5 px-10 pb-5 text-sm text-muted">
          <li>
            Share links with tags so you can see what worked, e.g.{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink">https://www.jtechright.com/en/account/signup?utm_source=instagram&amp;utm_campaign=december-offer</code>
          </li>
          <li>Pick Email opt-in or WhatsApp opt-in above, then Download CSV for your email tool or WhatsApp broadcast list.</li>
          <li>
            Every marketing email must include the person&apos;s <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink">unsubscribe_url</code> from the CSV.
          </li>
        </ul>
      </Panel>
    </>
  );
}
