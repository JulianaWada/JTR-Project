import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { requireTenant } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { naira } from "@/lib/money";
import { formatLagos } from "@/lib/time";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const tenant = await requireTenant();
  const db = await getDb();
  const list = await db.query.payments.findMany({
    where: eq(schema.payments.tenantId, tenant.id),
    orderBy: [desc(schema.payments.createdAt)],
    limit: 200,
  });
  const received = list.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amountKobo, 0);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-navy">Payments</h1>
      <p className="mb-4 text-sm text-slate-500">
        {naira(received)} received across the {list.length} most recent payment links. Payouts and refunds are managed in Paystack.
      </p>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Reference</th>
              <th>For</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap">{formatLagos(p.createdAt)}</td>
                <td>
                  <code className="text-xs">{p.reference}</code>
                  {p.provider === "mock" && <span className="ml-1 pill bg-slate-100 text-slate-600">test</span>}
                </td>
                <td>
                  <Link className="hover:text-electric" href={`/dashboard/chats/${p.customerId}`}>
                    {p.orderId ? "Order" : "Booking deposit"}
                  </Link>
                </td>
                <td className="whitespace-nowrap">{naira(p.amountKobo)}</td>
                <td>
                  <StatusPill status={p.status} />
                </td>
                <td className="whitespace-nowrap">{p.paidAt ? formatLagos(p.paidAt) : "–"}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
