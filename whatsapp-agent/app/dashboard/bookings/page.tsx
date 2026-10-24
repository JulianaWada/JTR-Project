import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { updateBookingStatus } from "@/app/dashboard/actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatusPill } from "@/components/status-pill";
import { requireTenant } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import type { Booking } from "@/lib/db/schema";
import { naira } from "@/lib/money";
import { formatLagos, fromLagos, lagosDate } from "@/lib/time";

export const metadata: Metadata = { title: "Bookings" };

function Rows({ list }: { list: Booking[] }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Service</th>
            <th>Customer</th>
            <th>Price / deposit</th>
            <th>Status</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {list.map((b) => (
            <tr key={b.id}>
              <td className="whitespace-nowrap">{formatLagos(b.startsAt)}</td>
              <td>
                {b.serviceName}
                {b.notes && <p className="text-xs text-slate-500">Note: {b.notes}</p>}
              </td>
              <td>
                <Link className="hover:text-electric" href={`/dashboard/chats/${b.customerId}`}>
                  {b.customerName}
                </Link>
                <p className="text-xs text-slate-500">{b.code}</p>
              </td>
              <td className="whitespace-nowrap">
                {naira(b.priceKobo)}
                {b.depositKobo > 0 && <p className="text-xs text-slate-500">deposit {naira(b.depositKobo)}</p>}
              </td>
              <td>
                <StatusPill status={b.status} />
              </td>
              <td>
                {["confirmed", "pending_payment"].includes(b.status) && (
                  <form action={updateBookingStatus.bind(null, b.id)} className="flex gap-2">
                    <select name="status" className="input py-1" defaultValue="">
                      <option value="" disabled>
                        Mark as…
                      </option>
                      {b.status === "pending_payment" && <option value="confirmed">Confirmed (paid another way)</option>}
                      <option value="completed">Completed</option>
                      <option value="no_show">No-show</option>
                      <option value="cancelled">Cancelled (tells the customer)</option>
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
                Nothing here yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function BookingsPage() {
  const tenant = await requireTenant();
  const db = await getDb();
  const startOfToday = fromLagos(lagosDate(new Date()), "00:00")!;
  const [upcoming, past] = await Promise.all([
    db.query.bookings.findMany({
      where: and(eq(schema.bookings.tenantId, tenant.id), gte(schema.bookings.startsAt, startOfToday)),
      orderBy: [asc(schema.bookings.startsAt)],
      limit: 200,
    }),
    db.query.bookings.findMany({
      where: and(eq(schema.bookings.tenantId, tenant.id), lt(schema.bookings.startsAt, startOfToday)),
      orderBy: [desc(schema.bookings.startsAt)],
      limit: 50,
    }),
  ]);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AutoRefresh seconds={15} />
      <div>
        <h1 className="text-2xl font-semibold text-navy">Bookings</h1>
        <p className="text-sm text-slate-500">Unpaid bookings are held for an hour, then released automatically.</p>
      </div>
      <section>
        <h2 className="mb-2 font-semibold text-navy">Today and upcoming</h2>
        <Rows list={upcoming} />
      </section>
      <section>
        <h2 className="mb-2 font-semibold text-navy">Past</h2>
        <Rows list={past} />
      </section>
    </div>
  );
}
