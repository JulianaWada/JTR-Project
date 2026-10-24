import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { updateOrderStatus } from "@/app/dashboard/actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatusPill } from "@/components/status-pill";
import { requireTenant } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { naira } from "@/lib/money";
import { formatLagos } from "@/lib/time";

export const metadata: Metadata = { title: "Orders" };

const NEXT_STEPS = [
  ["preparing", "Preparing"],
  ["ready", "Ready for pickup"],
  ["out_for_delivery", "Out for delivery"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

export default async function OrdersPage() {
  const tenant = await requireTenant();
  const db = await getDb();
  const list = await db.query.orders.findMany({
    where: eq(schema.orders.tenantId, tenant.id),
    orderBy: [desc(schema.orders.createdAt)],
    limit: 100,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <AutoRefresh seconds={15} />
      <h1 className="text-2xl font-semibold text-navy">Orders</h1>
      <p className="mb-4 text-sm text-slate-500">Changing the status sends the customer a WhatsApp update.</p>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Items</th>
              <th>Total</th>
              <th>Delivery</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link className="font-medium hover:text-electric" href={`/dashboard/chats/${o.customerId}`}>
                    {o.code}
                  </Link>
                  <p className="text-xs text-slate-500">{formatLagos(o.createdAt)}</p>
                </td>
                <td>
                  {o.lines.map((l) => (
                    <p key={l.itemId}>
                      {l.quantity} × {l.name}
                    </p>
                  ))}
                  {o.notes && <p className="text-xs text-slate-500">Note: {o.notes}</p>}
                </td>
                <td className="whitespace-nowrap">{naira(o.totalKobo)}</td>
                <td className="max-w-56">{o.fulfilment === "delivery" ? o.deliveryAddress : "Pickup"}</td>
                <td>
                  <StatusPill status={o.status} />
                </td>
                <td>
                  {["paid", "preparing", "ready", "out_for_delivery"].includes(o.status) && (
                    <form action={updateOrderStatus.bind(null, o.id)} className="flex gap-2">
                      <select name="status" className="input py-1" defaultValue="">
                        <option value="" disabled>
                          Move to…
                        </option>
                        {NEXT_STEPS.filter(([s]) => s !== o.status && (o.fulfilment === "delivery" ? s !== "ready" : s !== "out_for_delivery")).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button className="btn-secondary py-1">Save</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
