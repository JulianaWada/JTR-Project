import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatusPill } from "@/components/status-pill";
import { requireTenant } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { formatLagos } from "@/lib/time";

export const metadata: Metadata = { title: "Chats" };

export default async function ChatsPage() {
  const tenant = await requireTenant();
  const db = await getDb();
  const chats = await db.query.customers.findMany({
    where: eq(schema.customers.tenantId, tenant.id),
    orderBy: [desc(schema.customers.needsAttention), desc(schema.customers.lastMessageAt)],
    limit: 200,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <AutoRefresh seconds={10} />
      <h1 className="mb-4 text-2xl font-semibold text-navy">Chats</h1>
      <div className="card p-0">
        {chats.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No chats yet. When customers message your WhatsApp number, they appear here.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {chats.map((c) => (
              <li key={c.id}>
                <Link href={`/dashboard/chats/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {c.name ?? c.profileName ?? `+${c.waId}`}
                      {c.simulated && <span className="ml-2 pill bg-slate-100 text-slate-600">test</span>}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {c.needsAttention ? (c.handoverReason ?? "New message while a person is handling this chat") : c.simulated ? "Simulator" : `+${c.waId}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill status={c.mode} label={c.mode === "ai" ? "AI replying" : "Person replying"} />
                    {c.lastMessageAt && <span className="text-xs text-slate-400">{formatLagos(c.lastMessageAt)}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
