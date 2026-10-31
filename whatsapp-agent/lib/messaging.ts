import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { customers, messages, type Customer, type MessageAuthor, type Tenant } from "@/lib/db/schema";
import { env, modes } from "@/lib/env";
import { sendTemplate, sendText } from "@/lib/whatsapp/cloud-api";

const DAY_MS = 24 * 60 * 60 * 1000;

export type Template = { name: string; params: string[] };

/** WhatsApp only allows free-form messages within 24 hours of the customer's last message. */
export function insideServiceWindow(customer: Pick<Customer, "lastInboundAt">, now = new Date()) {
  return !!customer.lastInboundAt && now.getTime() - customer.lastInboundAt.getTime() < DAY_MS;
}

/** True when nothing should go to Meta: simulator chats, or no WhatsApp keys configured. */
function isMocked(customer: Pick<Customer, "simulated">) {
  return customer.simulated || modes().whatsapp === "mock";
}

/**
 * Sends a message to a customer and records it for the dashboard.
 * Outside the 24-hour window it falls back to the approved template, if one is given.
 */
export async function sendToCustomer(
  db: Database,
  tenant: Tenant,
  customer: Customer,
  body: string,
  opts: { author: MessageAuthor; template?: Template; now?: Date },
) {
  const now = opts.now ?? new Date();
  const inWindow = insideServiceWindow(customer, now);
  const [row] = await db
    .insert(messages)
    .values({
      tenantId: tenant.id,
      customerId: customer.id,
      direction: "out",
      author: opts.author,
      body,
      status: "pending",
      createdAt: now,
    })
    .returning();

  let status: "sent" | "simulated" | "failed" = "sent";
  let waMessageId: string | null = null;
  let error: string | null = null;
  try {
    if (!inWindow && !opts.template) {
      throw new Error("More than 24 hours since the customer last wrote, so WhatsApp only allows a template message.");
    }
    if (isMocked(customer)) {
      status = "simulated";
    } else if (inWindow) {
      waMessageId = await sendText(tenant.whatsappPhoneNumberId, customer.waId, body);
    } else {
      waMessageId = await sendTemplate(tenant.whatsappPhoneNumberId, customer.waId, opts.template!.name, opts.template!.params);
    }
  } catch (err) {
    status = "failed";
    error = err instanceof Error ? err.message : String(err);
    console.error(`[whatsapp] send to ${customer.waId} failed: ${error}`);
  }

  await db.update(messages).set({ status, waMessageId, error }).where(eq(messages.id, row.id));
  await db.update(customers).set({ lastMessageAt: now }).where(eq(customers.id, customer.id));
  return { ...row, status, waMessageId, error };
}

/**
 * Alerts the business owner on their own WhatsApp. Uses the "owner_alert" template because the
 * owner has usually not written to the business number in the last 24 hours.
 */
export async function alertOwner(tenant: Tenant, summary: string, customerLabel: string) {
  const link = `${env.appUrl}/dashboard/chats`;
  if (!tenant.ownerPhone || modes().whatsapp === "mock") {
    console.info(`[owner alert] ${tenant.name}: ${customerLabel}: ${summary}`);
    return;
  }
  try {
    await sendTemplate(tenant.whatsappPhoneNumberId, tenant.ownerPhone, "owner_alert", [customerLabel, summary, link]);
  } catch (err) {
    console.error("[owner alert] failed", err);
  }
}
