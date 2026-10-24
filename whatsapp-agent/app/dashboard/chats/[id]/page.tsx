import { and, asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { handBack, markSeen, takeOver } from "@/app/dashboard/actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { ChatThread } from "@/components/chat-thread";
import { StatusPill } from "@/components/status-pill";
import { requireTenant } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { insideServiceWindow } from "@/lib/messaging";
import { naira } from "@/lib/money";
import { formatLagos } from "@/lib/time";
import { ReplyForm } from "./reply-form";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await requireTenant();
  const db = await getDb();
  const customer = await db.query.customers.findFirst({
    where: and(eq(schema.customers.id, id), eq(schema.customers.tenantId, tenant.id)),
  });
  if (!customer) notFound();

  const [thread, orders, bookings] = await Promise.all([
    db.query.messages.findMany({ where: eq(schema.messages.customerId, id), orderBy: [asc(schema.messages.createdAt)] }),
    db.query.orders.findMany({ where: eq(schema.orders.customerId, id), orderBy: [desc(schema.orders.createdAt)], limit: 5 }),
    db.query.bookings.findMany({ where: eq(schema.bookings.customerId, id), orderBy: [desc(schema.bookings.startsAt)], limit: 5 }),
  ]);
  const windowOpen = customer.simulated || insideServiceWindow(customer);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_300px]">
      <AutoRefresh seconds={5} />
      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <Link href="/dashboard/chats" className="text-xs text-slate-500 hover:text-electric">
              ← All chats
            </Link>
            <h1 className="font-semibold text-navy">{customer.name ?? customer.profileName ?? `+${customer.waId}`}</h1>
            <p className="text-xs text-slate-500">{customer.simulated ? "Simulator chat" : `+${customer.waId}`}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={customer.mode} label={customer.mode === "ai" ? "AI replying" : "Person replying"} />
            {customer.mode === "ai" ? (
              <form action={takeOver.bind(null, customer.id)}>
                <button className="btn-secondary">Take over</button>
              </form>
            ) : (
              <form action={handBack.bind(null, customer.id)}>
                <button className="btn-secondary">Hand back to AI</button>
              </form>
            )}
            {customer.needsAttention && (
              <form action={markSeen.bind(null, customer.id)}>
                <button className="btn-secondary">Mark as handled</button>
              </form>
            )}
          </div>
        </header>
        {customer.needsAttention && customer.handoverReason && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800">Needs a person: {customer.handoverReason}</div>
        )}
        <div className="flex-1 overflow-y-auto bg-wa-bg p-4">
          <ChatThread messages={thread} perspective="owner" />
        </div>
        <div className="border-t border-slate-200 p-3">
          <ReplyForm
            customerId={customer.id}
            disabledReason={windowOpen ? undefined : "More than 24 hours since this customer wrote. WhatsApp only allows approved templates until they message again."}
          />
        </div>
      </section>

      <aside className="space-y-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-navy">Customer</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">WhatsApp name</dt>
              <dd>{customer.profileName ?? "–"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Booking name</dt>
              <dd>{customer.name ?? "–"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Reminders</dt>
              <dd>{customer.optedOut ? "Opted out" : "On"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">First contact</dt>
              <dd>{formatLagos(customer.createdAt)}</dd>
            </div>
          </dl>
        </div>
        {orders.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-navy">Orders</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex items-start justify-between gap-2">
                  <span>
                    {o.code} · {naira(o.totalKobo)}
                  </span>
                  <StatusPill status={o.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {bookings.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-navy">Bookings</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {bookings.map((b) => (
                <li key={b.id}>
                  <div className="flex items-start justify-between gap-2">
                    <span>{b.serviceName}</span>
                    <StatusPill status={b.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatLagos(b.startsAt)} · {b.code}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
