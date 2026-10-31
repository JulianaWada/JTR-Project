import Link from "next/link";
import { Panel, PageTitle, Pill, SampleNotice, Stat, Table, Td, humanise, statusTone } from "@/components/admin/ui";
import { formatDateTime, formatNaira } from "@/lib/admin/money";
import { listInterest, listLeads, siteCounts } from "@/lib/admin/site-data";
import { academyMode, listCourses, listPayments } from "@/lib/admin/sources/academy";
import { listBusinesses, whatsappMode } from "@/lib/admin/sources/whatsapp";

export const metadata = { title: "Overview" };

const courseNames = { sales: "Boost Sales with AI", animation: "Animation videos", both: "Both courses" } as const;

export default async function AdminOverview() {
  const [counts, leads, interest, courses, academyPayments, businesses] = await Promise.all([
    siteCounts(),
    listLeads(),
    listInterest(),
    listCourses().catch(() => null),
    listPayments().catch(() => null),
    listBusinesses().catch(() => null),
  ]);
  const students = courses?.reduce((n, c) => n + c.activeStudents, 0) ?? 0;
  const academyRevenue = academyPayments?.filter((p) => p.status === "success").reduce((n, p) => n + p.amountKobo, 0) ?? 0;
  const agentRevenue = businesses?.reduce((n, b) => n + b.paidKobo, 0) ?? 0;
  const attention = businesses?.reduce((n, b) => n + b.needsAttention, 0) ?? 0;
  const samples = [academyMode() === "sample" && "academy", whatsappMode() === "sample" && "WhatsApp agent"].filter(Boolean);

  return (
    <>
      <PageTitle title="Good to see you, Jules" subtitle="Everything across JTR at a glance. Times are Lagos time." />
      {samples.length > 0 && (
        <SampleNotice>
          The {samples.join(" and ")} figures are examples until their database links are added (see the README). Leads and academy sign-ups are
          real.
        </SampleNotice>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New leads" value={counts.newLeads} note={`${counts.weekLeads} in the last 7 days`} href="/admin/leads" />
        <Stat label="Academy sign-ups" value={counts.allInterest} note={`${counts.newInterest} not contacted yet`} href="/admin/academy/interest" />
        <Stat
          label="Academy students"
          value={courses ? students : "—"}
          note={courses ? `${formatNaira(academyRevenue)} paid` : "Academy database unreachable"}
          href="/admin/academy"
        />
        <Stat
          label="WhatsApp businesses"
          value={businesses ? businesses.length : "—"}
          note={businesses ? `${formatNaira(agentRevenue)} paid${attention ? ` · ${attention} ${attention > 1 ? "chats need" : "chat needs"} a person` : ""}` : "Agent database unreachable"}
          href="/admin/whatsapp"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Latest leads" action={<Link href="/admin/leads" className="text-sm font-semibold text-primary">All leads</Link>}>
          <Table compact head={["Received", "Name", "Status"]} empty="No enquiries yet. They appear here as soon as someone uses the contact form or the assistant.">
            {leads.slice(0, 6).map((l) => (
              <tr key={l.id}>
                <Td className="whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</Td>
                <Td>
                  <p className="font-semibold text-ink">{l.name}</p>
                  <p className="line-clamp-1 text-muted">{l.message}</p>
                </Td>
                <Td>
                  <Pill tone={statusTone(l.status)}>{humanise(l.status)}</Pill>
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Latest academy sign-ups" action={<Link href="/admin/academy/interest" className="text-sm font-semibold text-primary">All sign-ups</Link>}>
          <Table compact head={["Received", "Name", "Course"]} empty="No sign-ups yet. Share the invite card to get the first ones.">
            {interest.slice(0, 6).map((i) => (
              <tr key={i.id}>
                <Td className="whitespace-nowrap text-muted">{formatDateTime(i.createdAt)}</Td>
                <Td>
                  <p className="font-semibold text-ink">{i.name}</p>
                  <p className="text-muted">{i.phone}</p>
                </Td>
                <Td>{courseNames[i.course]}</Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
