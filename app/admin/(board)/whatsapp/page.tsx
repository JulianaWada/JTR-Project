import Link from "next/link";
import { PageTitle, Panel, Pill, SampleNotice, Stat, Table, Td, buttonClass, humanise, statusTone } from "@/components/admin/ui";
import { formatDate, formatDateTime, formatNaira } from "@/lib/admin/money";
import { listBusinesses, recentOrders, recentPayments, whatsappAppUrl, whatsappMode } from "@/lib/admin/sources/whatsapp";

export const metadata = { title: "WhatsApp agent" };

const kindNames = { salon: "Salon / bookings", food: "Food / orders", other: "Other" } as const;

export default async function WhatsappPage() {
  let data;
  try {
    const [businesses, orders, payments] = await Promise.all([listBusinesses(), recentOrders(), recentPayments()]);
    data = { businesses, orders, payments };
  } catch (err) {
    console.error("[admin] whatsapp agent database", err);
  }
  const appUrl = whatsappAppUrl();

  return (
    <>
      <PageTitle
        title="WhatsApp sales agent"
        subtitle="Every business on the agent. Each owner manages their own chats, orders and bookings from their dashboard."
        actions={
          <Link href="/admin/whatsapp/new" className={buttonClass}>
            Add a business
          </Link>
        }
      />
      {whatsappMode() === "sample" && (
        <SampleNotice>
          These are the agent&apos;s demo businesses. Add WHATSAPP_AGENT_DATABASE_URL to see real ones. Businesses you add now are kept only
          until the site restarts.
        </SampleNotice>
      )}
      {!data ? (
        <Panel>
          <p className="p-6 text-sm text-danger">The sales agent&apos;s database could not be reached. Check WHATSAPP_AGENT_DATABASE_URL.</p>
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Businesses" value={data.businesses.length} />
            <Stat label="Customers" value={data.businesses.reduce((n, b) => n + b.customers, 0)} />
            <Stat label="Need a person" value={data.businesses.reduce((n, b) => n + b.needsAttention, 0)} note="chats handed over by the agent" />
            <Stat label="Paid through the agent" value={formatNaira(data.businesses.reduce((n, b) => n + b.paidKobo, 0))} />
          </div>

          <Panel title="Businesses">
            <Table head={["Business", "WhatsApp", "Customers", "Orders", "Upcoming bookings", "Paid", "Last message"]} empty="No businesses yet.">
              {data.businesses.map((b) => (
                <tr key={b.id}>
                  <Td>
                    <p className="font-semibold text-ink">{b.name}</p>
                    <p className="text-muted">
                      {kindNames[b.kind]} · since {formatDate(b.createdAt)}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap">{b.displayNumber ?? <span className="text-muted">Not set</span>}</Td>
                  <Td>
                    {b.customers}
                    {b.needsAttention > 0 && (
                      <div className="mt-1">
                        <Pill tone="red">{b.needsAttention} waiting for a person</Pill>
                      </div>
                    )}
                  </Td>
                  <Td>{b.orders}</Td>
                  <Td>{b.upcomingBookings}</Td>
                  <Td className="whitespace-nowrap">{formatNaira(b.paidKobo)}</Td>
                  <Td className="whitespace-nowrap text-muted">{b.lastMessageAt ? formatDateTime(b.lastMessageAt) : "No messages yet"}</Td>
                </tr>
              ))}
            </Table>
            {appUrl && (
              <p className="border-t border-line px-5 py-3 text-sm text-muted">
                Owners sign in at{" "}
                <a href={`${appUrl}/login`} className="font-semibold text-primary">
                  {appUrl.replace(/^https?:\/\//, "")}/login
                </a>
              </p>
            )}
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Latest orders">
              <Table head={["Order", "Customer", "Total", "Status"]} empty="No orders yet.">
                {data.orders.map((o) => (
                  <tr key={o.id}>
                    <Td>
                      <p className="font-semibold text-ink">{o.code}</p>
                      <p className="text-muted">
                        {o.business} · {formatDateTime(o.createdAt)}
                      </p>
                    </Td>
                    <Td>
                      {o.customer}
                      <p className="text-muted">{humanise(o.fulfilment)}</p>
                    </Td>
                    <Td className="whitespace-nowrap">{formatNaira(o.totalKobo)}</Td>
                    <Td>
                      <Pill tone={statusTone(o.status)}>{humanise(o.status)}</Pill>
                    </Td>
                  </tr>
                ))}
              </Table>
            </Panel>
            <Panel title="Latest payments">
              <Table head={["Date", "Customer", "Amount", "Status"]} empty="No payments yet.">
                {data.payments.map((p) => (
                  <tr key={p.id}>
                    <Td className="whitespace-nowrap text-muted">{formatDateTime(p.createdAt)}</Td>
                    <Td>
                      {p.customer}
                      <p className="text-muted">
                        {p.business} · {p.forWhat}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap">{formatNaira(p.amountKobo)}</Td>
                    <Td>
                      <Pill tone={statusTone(p.status)}>{humanise(p.status)}</Pill>
                      {p.provider === "mock" && <p className="mt-1 text-xs text-muted">Test checkout</p>}
                    </Td>
                  </tr>
                ))}
              </Table>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
