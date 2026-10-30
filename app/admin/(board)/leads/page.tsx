import { PageTitle, Panel, Pill, Table, Td } from "@/components/admin/ui";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { StatusTabs, parseStatus } from "@/components/admin/StatusTabs";
import { formatDateTime } from "@/lib/admin/money";
import { leadStatuses, listLeads } from "@/lib/admin/site-data";
import en from "@/messages/en.json";
import { updateLeadStatus } from "../../actions";

export const metadata = { title: "Leads" };

const serviceNames = en.services as unknown as Record<string, { name?: string }>;
const budgetLabel = (b: string) => b.replace("under-", "Under ").replace("over-", "Over ").replace(/^(\d+k)-(\d+k)$/, "$1 to $2").replace("not-sure", "Budget not sure");

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const status = parseStatus((await searchParams).status);
  const leads = await listLeads({ status });
  return (
    <>
      <PageTitle
        title="Leads"
        subtitle="Enquiries from the contact form and the JTR Assistant. Each one is also emailed to you once Resend is set up."
        actions={
          <a href="/admin/export/leads" download className="text-sm font-semibold text-primary">
            Download CSV
          </a>
        }
      />
      <Panel title={`${leads.length} ${leads.length === 1 ? "lead" : "leads"}`} action={<StatusTabs base="/admin/leads" current={status} />}>
        <Table head={["Received", "Contact", "Project", "Message", "Status"]} empty="No leads here yet.">
          {leads.map((l) => (
            <tr key={l.id}>
              <Td className="whitespace-nowrap text-muted">
                {formatDateTime(l.createdAt)}
                <div className="mt-1 flex flex-wrap gap-1">
                  <Pill tone={l.source === "assistant" ? "blue" : "neutral"}>{l.source === "assistant" ? "Assistant" : "Contact form"}</Pill>
                  {!l.emailed && <Pill tone="amber">Not emailed</Pill>}
                </div>
              </Td>
              <Td>
                <p className="font-semibold text-ink">{l.name}</p>
                <a href={`mailto:${l.email}`} className="block text-primary">
                  {l.email}
                </a>
                {l.phone && (
                  <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} className="block text-muted hover:text-primary">
                    {l.phone}
                  </a>
                )}
                {l.company && <p className="text-muted">{l.company}</p>}
              </Td>
              <Td className="text-muted">
                {[l.service && (serviceNames[l.service]?.name ?? l.service), l.budget && `${budgetLabel(l.budget)}${l.currency ? ` ${l.currency}` : ""}`, l.country, l.locale.toUpperCase()].filter(Boolean).join(" · ")}
              </Td>
              <Td className="max-w-md">
                <details>
                  <summary className="line-clamp-2 cursor-pointer text-ink">{l.message}</summary>
                  <p className="mt-2 whitespace-pre-wrap text-ink">{l.message}</p>
                </details>
              </Td>
              <Td>
                <StatusSelect id={l.id} value={l.status} options={leadStatuses} action={updateLeadStatus} label={`Status for ${l.name}`} />
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
