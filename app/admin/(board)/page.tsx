import Link from "next/link";
import { BarList, DailyBars } from "@/components/admin/charts";
import { PageTitle, Panel, Stat, buttonClass, secondaryButtonClass } from "@/components/admin/ui";
import { Icon, type IconName } from "@/components/ui/Icon";
import { formatDateTime, formatNaira } from "@/lib/admin/money";
import { dailyCounts, interestByCourse, listInterest, listLeads, siteCounts } from "@/lib/admin/site-data";
import { academyMode, listCourses, listPayments } from "@/lib/admin/sources/academy";
import { listBusinesses, recentPayments, whatsappMode } from "@/lib/admin/sources/whatsapp";
import { cn } from "@/lib/cn";

export const metadata = { title: "Overview" };

const courseNames = { sales: "Boost Sales with AI", animation: "Create Animation Videos with AI", both: "Both courses" } as const;

type Activity = { at: Date; icon: IconName; tone: string; title: string; detail: string; href: string };

const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" });

export default async function AdminOverview() {
  const [counts, leads, interest, byCourse, daily, courses, academyPayments, businesses, agentPayments] = await Promise.all([
    siteCounts(),
    listLeads(),
    listInterest(),
    interestByCourse(),
    dailyCounts(14),
    listCourses().catch(() => null),
    listPayments().catch(() => null),
    listBusinesses().catch(() => null),
    recentPayments(10).catch(() => null),
  ]);
  const students = courses?.reduce((n, c) => n + c.activeStudents, 0) ?? 0;
  const academyRevenue = academyPayments?.filter((p) => p.status === "success").reduce((n, p) => n + p.amountKobo, 0) ?? 0;
  const agentRevenue = businesses?.reduce((n, b) => n + b.paidKobo, 0) ?? 0;
  const attention = businesses?.reduce((n, b) => n + b.needsAttention, 0) ?? 0;
  const academyOn = academyMode() === "live";
  const agentOn = whatsappMode() === "live";

  const activity: Activity[] = [
    ...leads.slice(0, 8).map((l) => ({
      at: l.createdAt,
      icon: "mail" as const,
      tone: "bg-[#e3eefc] text-[#1563d6]",
      title: `New enquiry from ${l.name}`,
      detail: l.source === "assistant" ? "Via the JTR Assistant" : l.company || "Contact form",
      href: "/admin/leads",
    })),
    ...interest.slice(0, 8).map((i) => ({
      at: i.createdAt,
      icon: "edtech" as const,
      tone: "bg-[#efe9fd] text-[#6d3fd6]",
      title: `${i.name} signed up for the academy`,
      detail: courseNames[i.course],
      href: "/admin/academy/interest",
    })),
    ...(academyPayments ?? [])
      .filter((p) => p.status === "success")
      .slice(0, 5)
      .map((p) => ({
        at: p.createdAt,
        icon: "check" as const,
        tone: "bg-[#e3f5ec] text-[#0f7b4a]",
        title: `${p.student} paid ${formatNaira(p.amountKobo)}`,
        detail: `${p.course} · academy`,
        href: "/admin/academy",
      })),
    ...(agentPayments ?? [])
      .filter((p) => p.status === "success")
      .slice(0, 5)
      .map((p) => ({
        at: p.createdAt,
        icon: "whatsapp" as const,
        tone: "bg-[#e3f5ec] text-[#0f7b4a]",
        title: `${p.customer} paid ${formatNaira(p.amountKobo)}`,
        detail: `${p.business} · ${p.forWhat}`,
        href: "/admin/whatsapp",
      })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  const todo = [
    { count: counts.newLeads, label: counts.newLeads === 1 ? "new lead to reply to" : "new leads to reply to", href: "/admin/leads?status=new" },
    { count: counts.newInterest, label: counts.newInterest === 1 ? "academy sign-up to contact" : "academy sign-ups to contact", href: "/admin/academy/interest?status=new" },
    ...(agentOn
      ? [{ count: attention, label: attention === 1 ? "WhatsApp chat waiting for a person" : "WhatsApp chats waiting for a person", href: "/admin/whatsapp" }]
      : []),
  ];

  return (
    <>
      <PageTitle
        title="Overview"
        subtitle={`${today.format(new Date())} · times are Lagos time`}
        actions={
          <>
            <a href="/admin/export/leads" download className={secondaryButtonClass}>
              <Icon name="arrowUpRight" size={16} className="rotate-90" />
              Leads CSV
            </a>
            {agentOn ? (
              <Link href="/admin/whatsapp/new" className={buttonClass}>
                Add a business
              </Link>
            ) : (
              <Link href="/en" className={buttonClass}>
                View website
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="New leads" value={counts.newLeads} note={`${counts.weekLeads} in the last 7 days`} href="/admin/leads" icon="mail" tone="blue" />
        <Stat
          label="Academy sign-ups"
          value={counts.allInterest}
          note={`${counts.newInterest} not contacted yet`}
          href="/admin/academy/interest"
          icon="edtech"
          tone="violet"
        />
        <Stat
          label="Academy students"
          value={academyOn && courses ? students : "—"}
          note={!academyOn ? "Academy not connected yet" : courses ? `${formatNaira(academyRevenue)} paid` : "Academy database unreachable"}
          href="/admin/academy"
          icon="users"
          tone="green"
        />
        <Stat
          label="WhatsApp businesses"
          value={agentOn && businesses ? businesses.length : "—"}
          note={!agentOn ? "Sales agent not connected yet" : businesses ? `${formatNaira(agentRevenue)} paid through the agent` : "Agent database unreachable"}
          href="/admin/whatsapp"
          icon="whatsapp"
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Leads and sign-ups" subtitle="Last 14 days" className="xl:col-span-2">
          <div className="pb-5">
            <DailyBars
              days={daily.map((d) => d.day)}
              series={[
                { key: "leads", label: "Leads", color: "blue", values: daily.map((d) => d.leads) },
                { key: "signups", label: "Academy sign-ups", color: "violet", values: daily.map((d) => d.signups) },
              ]}
            />
          </div>
        </Panel>
        <Panel title="Sign-ups by course" subtitle={`${counts.allInterest} people registered interest`}>
          <BarList
            color="violet"
            items={[
              { label: courseNames.sales, value: byCourse.sales ?? 0 },
              { label: courseNames.animation, value: byCourse.animation ?? 0 },
              { label: courseNames.both, value: byCourse.both ?? 0 },
            ]}
          />
          <div className="border-t border-line px-5 py-3">
            <Link href="/admin/academy/interest" className="text-sm font-semibold text-primary">
              See everyone
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Panel title="Needs your attention">
            <ul className="divide-y divide-line">
              {todo.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2/60">
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums",
                        t.count ? "bg-[#1563d6] text-white" : "bg-surface-2 text-muted",
                      )}
                    >
                      {t.count}
                    </span>
                    <span className={cn("flex-1 text-sm", t.count ? "text-ink" : "text-muted")}>{t.label}</span>
                    <Icon name="arrowRight" size={16} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Income" subtitle="Successful payments to date. WhatsApp payments go to each business.">
            <BarList
              format={formatNaira}
              items={[
                { label: "JTR Academy", value: academyRevenue, note: academyOn ? undefined : "not connected" },
                { label: "WhatsApp agent", value: agentRevenue, note: agentOn ? undefined : "not connected" },
              ]}
            />
          </Panel>
        </div>

        <Panel title="Recent activity" className="xl:col-span-2">
          {activity.length === 0 ? (
            <p className="px-5 pb-6 text-sm text-muted">Nothing yet. New leads, sign-ups and payments appear here.</p>
          ) : (
            <ol className="px-5 pb-3">
              {activity.map((a, i) => (
                <li key={i} className="relative flex gap-3 pb-4">
                  {i < activity.length - 1 && <span className="absolute top-9 bottom-0 left-4 w-px bg-line" aria-hidden="true" />}
                  <span className={cn("relative grid size-8 shrink-0 place-items-center rounded-full", a.tone)}>
                    <Icon name={a.icon} size={15} />
                  </span>
                  <Link href={a.href} className="min-w-0 flex-1 rounded-lg pt-1 hover:text-primary">
                    <p className="truncate text-sm font-medium text-ink">{a.title}</p>
                    <p className="truncate text-xs text-muted">{a.detail}</p>
                  </Link>
                  <time className="shrink-0 pt-1 text-xs text-muted tabular-nums" dateTime={a.at.toISOString()}>
                    {formatDateTime(a.at)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
