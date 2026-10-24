import { and, eq } from "drizzle-orm";
import { processChat } from "@/lib/agent/run";
import { handOver } from "@/lib/agent/tools";
import type { Database } from "@/lib/db";
import { customers, messages, tenants, type Customer, type Tenant } from "@/lib/db/schema";
import { sendToCustomer } from "@/lib/messaging";
import type { InboundMessage } from "@/lib/whatsapp/cloud-api";

const STOP_WORDS = /^(stop|unsubscribe|stop all|opt out)$/i;
const START_WORDS = /^(start|subscribe|unstop)$/i;
const HUMAN_WORDS = /^(human|agent|person|talk to a person|customer care)$/i;

async function findOrCreateCustomer(db: Database, tenant: Tenant, msg: InboundMessage, simulated: boolean): Promise<Customer> {
  const existing = await db.query.customers.findFirst({
    where: and(eq(customers.tenantId, tenant.id), eq(customers.waId, msg.from)),
  });
  if (existing) {
    if (msg.profileName && msg.profileName !== existing.profileName) {
      await db.update(customers).set({ profileName: msg.profileName }).where(eq(customers.id, existing.id));
    }
    return existing;
  }
  const [created] = await db
    .insert(customers)
    .values({ tenantId: tenant.id, waId: msg.from, profileName: msg.profileName ?? null, simulated })
    .onConflictDoNothing()
    .returning();
  return (
    created ??
    (await db.query.customers.findFirst({ where: and(eq(customers.tenantId, tenant.id), eq(customers.waId, msg.from)) }))!
  );
}

/**
 * Stores one incoming WhatsApp message and lets the agent answer it.
 * Returns false when the message was already handled (Meta can deliver a webhook more than once).
 */
export async function handleInbound(
  db: Database,
  msg: InboundMessage,
  opts: { simulated?: boolean; now?: () => Date; runAgent?: boolean } = {},
): Promise<{ handled: boolean; customerId?: string }> {
  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.whatsappPhoneNumberId, msg.phoneNumberId) });
  if (!tenant) {
    console.warn(`[inbound] no business is set up for phone number id ${msg.phoneNumberId}`);
    return { handled: false };
  }
  const now = opts.now?.() ?? new Date();
  const customer = await findOrCreateCustomer(db, tenant, msg, opts.simulated ?? false);

  const [stored] = await db
    .insert(messages)
    .values({
      tenantId: tenant.id,
      customerId: customer.id,
      direction: "in",
      author: "customer",
      body: msg.text,
      waMessageId: msg.id,
      status: "received",
      createdAt: now,
    })
    .onConflictDoNothing({ target: messages.waMessageId })
    .returning();
  if (!stored) return { handled: false };

  await db.update(customers).set({ lastInboundAt: now, lastMessageAt: now }).where(eq(customers.id, customer.id));
  const fresh = { ...customer, lastInboundAt: now };
  const word = msg.text.trim().replace(/[.!]+$/, "");

  if (STOP_WORDS.test(word)) {
    await db.update(messages).set({ seenByAgent: true }).where(eq(messages.id, stored.id));
    await db.update(customers).set({ optedOut: true }).where(eq(customers.id, customer.id));
    await sendToCustomer(db, tenant, fresh, `You won't get reminders or updates from ${tenant.name} any more. You can still message us any time. Reply START to turn them back on.`, { author: "system", now });
    return { handled: true, customerId: customer.id };
  }
  if (START_WORDS.test(word)) {
    await db.update(messages).set({ seenByAgent: true }).where(eq(messages.id, stored.id));
    await db.update(customers).set({ optedOut: false }).where(eq(customers.id, customer.id));
    await sendToCustomer(db, tenant, fresh, "Reminders and updates are back on. 👍🏾", { author: "system", now });
    return { handled: true, customerId: customer.id };
  }
  if (customer.mode === "ai" && HUMAN_WORDS.test(word)) {
    await handOver(db, tenant, fresh, "The customer asked to talk to a person.");
    await sendToCustomer(db, tenant, fresh, "Sure, a member of our team will reply to you here shortly. 🙏🏾", { author: "system", now });
    return { handled: true, customerId: customer.id };
  }

  if (customer.mode === "human") {
    // A person is handling this chat; make sure they see the new message.
    await db.update(customers).set({ needsAttention: true }).where(eq(customers.id, customer.id));
    return { handled: true, customerId: customer.id };
  }

  if (opts.runAgent !== false) await processChat(db, customer.id, { now: opts.now });
  return { handled: true, customerId: customer.id };
}
