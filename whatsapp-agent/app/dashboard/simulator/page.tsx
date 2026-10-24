import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { newSimulatorChat, simulateMessage } from "@/app/dashboard/actions";
import { ChatThread } from "@/components/chat-thread";
import { requireTenant } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { modes } from "@/lib/env";
import { SimulatorInput } from "./simulator-input";

export const metadata: Metadata = { title: "Try the agent" };

const SUGGESTIONS: Record<string, string[]> = {
  salon: [
    "Hi, how much is knotless braids?",
    "I want to book knotless braids tomorrow at 2pm. My name is Ada",
    "abeg una dey open on Sunday?",
    "Can I talk to a person?",
  ],
  food: [
    "Good afternoon, wetin una get today?",
    "I want 2 jollof rice and one zobo",
    "Deliver to 5 Ahmadu Bello Way, Garki",
    "Has my order been received?",
  ],
};

export default async function SimulatorPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const tenant = await requireTenant();
  const { as } = await searchParams;
  const phone = as && /^sim\d{6,12}$/.test(as) ? as : "sim100001";
  const db = await getDb();
  const customer = await db.query.customers.findFirst({
    where: and(eq(schema.customers.tenantId, tenant.id), eq(schema.customers.waId, phone)),
  });
  const thread = customer
    ? await db.query.messages.findMany({ where: eq(schema.messages.customerId, customer.id), orderBy: [asc(schema.messages.createdAt)] })
    : [];
  const claude = modes().claude;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[380px_1fr]">
      <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[2rem] border-8 border-slate-900 bg-wa-bg shadow-xl">
        <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">{tenant.name.slice(0, 1)}</div>
          <div>
            <p className="text-sm font-semibold">{tenant.name}</p>
            <p className="text-[11px] text-white/70">Business account</p>
          </div>
        </div>
        <div className="flex h-[520px] flex-col-reverse overflow-y-auto p-3">
          <div>
            {thread.length === 0 && (
              <p className="mx-auto my-4 w-fit rounded-md bg-[#fff5c4] px-3 py-1.5 text-center text-xs text-slate-700">
                Send a message to start. Nothing here goes to real WhatsApp.
              </p>
            )}
            <ChatThread messages={thread} perspective="customer" />
          </div>
        </div>
        <SimulatorInput action={simulateMessage.bind(null, phone)} />
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Try the agent</h1>
          <p className="text-sm text-slate-500">
            Chat as a customer to see exactly what your customers get. Bookings, orders and payment links are real records in your dashboard, marked as test.
          </p>
        </div>
        <div className="card text-sm">
          <p>
            Replies come from{" "}
            {claude === "live" ? (
              <strong>Claude</strong>
            ) : (
              <>
                <strong>the offline demo brain</strong>, a simple stand-in that understands a few phrasings. Add an Anthropic API key to use Claude, which understands anything a customer writes.
              </>
            )}
          </p>
        </div>
        <div className="card">
          <p className="mb-2 text-sm font-medium">Things to try</p>
          <ul className="space-y-1 text-sm text-slate-600">
            {(SUGGESTIONS[tenant.kind] ?? SUGGESTIONS.salon).map((s) => (
              <li key={s}>“{s}”</li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2">
          <form action={newSimulatorChat}>
            <button className="btn-secondary">Start a new test customer</button>
          </form>
          {customer && (
            <Link className="btn-secondary" href={`/dashboard/chats/${customer.id}`}>
              Open in Chats
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
