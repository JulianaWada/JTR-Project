import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { requireTenant } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { modes } from "@/lib/env";
import { naira } from "@/lib/money";
import { formatLagos, fromLagos, lagosDate, lagosTime } from "@/lib/time";

export const metadata: Metadata = { title: "Overview" };

const { customers, bookings, orders, payments } = schema;

function Stat({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const body = (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function Overview() {
  const tenant = await requireTenant();
  const db = await getDb();
  const now = new Date();
  const today = lagosDate(now);
  const dayStart = fromLagos(today, "00:00")!;
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const isFood = tenant.kind === "food";

  const [chatsToday, waiting, paidWeek, todaysBookings, openOrders] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(customers)
      .where(and(eq(customers.tenantId, tenant.id), gte(customers.lastInboundAt, dayStart))),
    db.query.customers.findMany({
      where: and(eq(customers.tenantId, tenant.id), eq(customers.needsAttention, true)),
      orderBy: [desc(customers.lastMessageAt)],
      limit: 5,
    }),
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amountKobo}), 0)::int`, n: sql<number>`count(*)::int` })
      .from(payments)
      .where(and(eq(payments.tenantId, tenant.id), eq(payments.status, "success"), gte(payments.paidAt, weekAgo))),
    db.query.bookings.findMany({
      where: and(
        eq(bookings.tenantId, tenant.id),
        gte(bookings.startsAt, dayStart),
        lt(bookings.startsAt, dayEnd),
        inArray(bookings.status, ["confirmed", "pending_payment", "completed"]),
      ),
      orderBy: [bookings.startsAt],
    }),
    db.query.orders.findMany({
      where: and(eq(orders.tenantId, tenant.id), inArray(orders.status, ["paid", "preparing", "ready", "out_for_delivery"])),
      orderBy: [orders.createdAt],
    }),
  ]);

  const m = modes();
  const testMode = m.whatsapp === "mock" || m.paystack === "mock" || m.claude === "mock";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Good {Number(lagosTime(now).slice(0, 2)) < 12 ? "morning" : "day"} 👋🏾</h1>
        <p className="text-sm text-slate-500">{formatLagos(now)} · Lagos time</p>
      </div>

      {testMode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Test mode.</strong>{" "}
          {[
            m.claude === "mock" && "replies come from a simple offline demo brain instead of Claude",
            m.whatsapp === "mock" && "nothing is sent on WhatsApp",
            m.paystack === "mock" && "payment links open a test checkout",
          ]
            .filter(Boolean)
            .join("; ")}
          . Try it from <Link className="underline" href="/dashboard/simulator">Try the agent</Link>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Customers who wrote today" value={chatsToday[0].value} href="/dashboard/chats" />
        <Stat label="Waiting for a person" value={waiting.length} href="/dashboard/chats" />
        {isFood ? (
          <Stat label="Orders in progress" value={openOrders.length} href="/dashboard/orders" />
        ) : (
          <Stat label="Bookings today" value={todaysBookings.length} href="/dashboard/bookings" />
        )}
        <Stat label="Paid in the last 7 days" value={naira(paidWeek[0].total)} href="/dashboard/payments" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="font-semibold text-navy">Waiting for a person</h2>
          {waiting.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Nobody right now. The assistant is handling every chat.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {waiting.map((c) => (
                <li key={c.id} className="py-2">
                  <Link href={`/dashboard/chats/${c.id}`} className="block hover:text-electric">
                    <span className="font-medium">{c.name ?? c.profileName ?? `+${c.waId}`}</span>
                    <span className="block text-sm text-slate-500">{c.handoverReason ?? "New message"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isFood ? (
          <section className="card">
            <h2 className="font-semibold text-navy">Orders to prepare</h2>
            {openOrders.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No paid orders waiting.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {openOrders.map((o) => (
                  <li key={o.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{o.code}</span> · {o.lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}
                    </span>
                    <StatusPill status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="card">
            <h2 className="font-semibold text-navy">Today&apos;s appointments</h2>
            {todaysBookings.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No appointments today.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {todaysBookings.map((b) => (
                  <li key={b.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{formatLagos(b.startsAt, { withDate: false })}</span> · {b.serviceName} · {b.customerName}
                    </span>
                    <StatusPill status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
