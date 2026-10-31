import Link from "next/link";
import { PageTitle, Panel, Pill, Stat, Table, Td } from "@/components/admin/ui";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { StatusTabs, parseStatus } from "@/components/admin/StatusTabs";
import { formatDateTime } from "@/lib/admin/money";
import { interestByCourse, leadStatuses, listInterest } from "@/lib/admin/site-data";
import { updateInterestStatus } from "../../../actions";

export const metadata = { title: "Academy sign-ups" };

const courseNames = { sales: "Boost Sales with AI", animation: "Create Animation Videos with AI", both: "Both courses" } as const;
const heardFromNames: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  x: "X",
  facebook: "Facebook",
  tiktok: "TikTok",
  friend: "A friend",
  other: "Other",
};

export default async function InterestPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const status = parseStatus((await searchParams).status);
  const [entries, byCourse] = await Promise.all([listInterest({ status }), interestByCourse()]);
  return (
    <>
      <PageTitle
        title="Academy sign-ups"
        subtitle={
          <>
            People who registered their interest on the invite card&apos;s form at{" "}
            <Link href="/en/academy/interest" className="font-semibold text-primary">
              /academy/interest
            </Link>
            . Message them on WhatsApp when enrolment opens.
          </>
        }
        actions={
          <>
            <Link href="/admin/academy" className="text-sm font-semibold text-muted hover:text-ink">
              Back to academy
            </Link>
            <a href="/admin/export/interest" download className="text-sm font-semibold text-primary">
              Download CSV
            </a>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Boost Sales with AI" value={(byCourse.sales ?? 0) + (byCourse.both ?? 0)} note="including both" icon="trendingUp" tone="blue" />
        <Stat label="Animation videos" value={(byCourse.animation ?? 0) + (byCourse.both ?? 0)} note="including both" icon="video" tone="violet" />
        <Stat label="Want both courses" value={byCourse.both ?? 0} icon="star" tone="green" />
      </div>
      <Panel title={`${entries.length} ${entries.length === 1 ? "sign-up" : "sign-ups"}`} action={<StatusTabs base="/admin/academy/interest" current={status} />}>
        <Table head={["Received", "Name", "Contact", "Course", "From", "Status"]} empty="No sign-ups here yet.">
          {entries.map((e) => (
            <tr key={e.id}>
              <Td className="whitespace-nowrap text-muted">{formatDateTime(e.createdAt)}</Td>
              <Td>
                <p className="font-semibold text-ink">{e.name}</p>
                {e.location && <p className="text-muted">{e.location}</p>}
              </Td>
              <Td>
                <a href={`https://wa.me/${e.phone.replace(/\D/g, "")}`} className="block text-primary">
                  {e.phone}
                </a>
                {e.email && (
                  <a href={`mailto:${e.email}`} className="block text-muted hover:text-primary">
                    {e.email}
                  </a>
                )}
              </Td>
              <Td>
                <Pill tone={e.course === "both" ? "green" : "blue"}>{courseNames[e.course]}</Pill>
              </Td>
              <Td className="text-muted">{e.heardFrom ? heardFromNames[e.heardFrom] ?? e.heardFrom : "—"}</Td>
              <Td>
                <StatusSelect id={e.id} value={e.status} options={leadStatuses} action={updateInterestStatus} label={`Status for ${e.name}`} />
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
