import "server-only";
import { randomBytes, scryptSync } from "node:crypto";
import { connect, envUrl, type SourceMode } from "./pg";

// The WhatsApp sales agent (whatsapp-agent/). Its schema is whatsapp-agent/lib/db/schema.ts.
// Set WHATSAPP_AGENT_DATABASE_URL to read it; until then the board shows that the agent is not connected.

export type BusinessKind = "salon" | "food" | "other";

export type BusinessSummary = {
  id: string;
  slug: string;
  name: string;
  kind: BusinessKind;
  displayNumber: string | null;
  ownerPhone: string | null;
  createdAt: Date;
  customers: number;
  needsAttention: number;
  orders: number;
  upcomingBookings: number;
  paidKobo: number;
  lastMessageAt: Date | null;
};

export type AgentOrder = {
  id: string;
  code: string;
  business: string;
  customer: string;
  totalKobo: number;
  status: string;
  fulfilment: string;
  createdAt: Date;
};

export type AgentPayment = {
  id: string;
  reference: string;
  business: string;
  customer: string;
  amountKobo: number;
  status: string;
  provider: string;
  forWhat: string;
  createdAt: Date;
};

export type NewBusiness = {
  name: string;
  slug: string;
  kind: BusinessKind;
  whatsappPhoneNumberId: string;
  whatsappDisplayNumber?: string;
  ownerPhone?: string;
  address?: string;
};

export type AddBusinessResult = { ok: true; slug: string; password: string } | { ok: false; error: string };

export function whatsappMode(): SourceMode {
  return envUrl("WHATSAPP_AGENT_DATABASE_URL") ? "live" : "off";
}

/** Link to the business dashboard login, if the agent's address is known. */
export function whatsappAppUrl() {
  return envUrl("WHATSAPP_AGENT_URL")?.replace(/\/$/, "");
}

function db() {
  return connect(envUrl("WHATSAPP_AGENT_DATABASE_URL")!);
}

export async function listBusinesses(): Promise<BusinessSummary[]> {
  if (whatsappMode() === "off") return [];
  const rows = await db()`
    select t.id, t.slug, t.name, t.kind, t.whatsapp_display_number, t.owner_phone, t.created_at,
      (select count(*) from customers c where c.tenant_id = t.id)::int as customers,
      (select count(*) from customers c where c.tenant_id = t.id and c.needs_attention)::int as needs_attention,
      (select max(c.last_message_at) from customers c where c.tenant_id = t.id) as last_message_at,
      (select count(*) from orders o where o.tenant_id = t.id)::int as orders,
      (select count(*) from bookings b where b.tenant_id = t.id and b.status = 'confirmed' and b.starts_at > now())::int as upcoming_bookings,
      (select coalesce(sum(p.amount_kobo), 0) from payments p where p.tenant_id = t.id and p.status = 'success')::bigint as paid_kobo
    from tenants t
    order by t.created_at`;
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    kind: r.kind,
    displayNumber: r.whatsapp_display_number,
    ownerPhone: r.owner_phone,
    createdAt: new Date(r.created_at),
    customers: r.customers,
    needsAttention: r.needs_attention,
    orders: r.orders,
    upcomingBookings: r.upcoming_bookings,
    paidKobo: Number(r.paid_kobo),
    lastMessageAt: r.last_message_at ? new Date(r.last_message_at) : null,
  }));
}

export async function recentOrders(limit = 20): Promise<AgentOrder[]> {
  if (whatsappMode() === "off") return [];
  const rows = await db()`
    select o.id, o.code, t.name as business, coalesce(c.name, c.profile_name, c.wa_id) as customer,
      o.total_kobo, o.status, o.fulfilment, o.created_at
    from orders o join tenants t on t.id = o.tenant_id join customers c on c.id = o.customer_id
    order by o.created_at desc limit ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    business: r.business,
    customer: r.customer,
    totalKobo: r.total_kobo,
    status: r.status,
    fulfilment: r.fulfilment,
    createdAt: new Date(r.created_at),
  }));
}

export async function recentPayments(limit = 20): Promise<AgentPayment[]> {
  if (whatsappMode() === "off") return [];
  const rows = await db()`
    select p.id, p.reference, t.name as business, coalesce(c.name, c.profile_name, c.wa_id) as customer,
      p.amount_kobo, p.status, p.provider, p.created_at,
      case when p.order_id is not null then 'Order' when p.booking_id is not null then 'Booking deposit' else 'Payment' end as for_what
    from payments p join tenants t on t.id = p.tenant_id join customers c on c.id = p.customer_id
    order by p.created_at desc limit ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    business: r.business,
    customer: r.customer,
    amountKobo: r.amount_kobo,
    status: r.status,
    provider: r.provider,
    forWhat: r.for_what,
    createdAt: new Date(r.created_at),
  }));
}

/** Same format as whatsapp-agent/lib/passwords.ts, so the owner can sign in to their dashboard. */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function newPassword() {
  // No look-alike characters, so it can be read out over the phone.
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(12), (b) => alphabet[b % alphabet.length]).join("");
}

const defaultHours = {
  mon: ["09:00", "18:00"],
  tue: ["09:00", "18:00"],
  wed: ["09:00", "18:00"],
  thu: ["09:00", "18:00"],
  fri: ["09:00", "18:00"],
  sat: ["10:00", "16:00"],
  sun: null,
};

/**
 * Creates a business with a dashboard login. The owner fills in services or products, hours and
 * policies from their own dashboard (Settings) after signing in.
 */
export async function addBusiness(input: NewBusiness): Promise<AddBusinessResult> {
  const password = newPassword();
  if (whatsappMode() === "off") {
    return { ok: false, error: "Connect the WhatsApp sales agent first: set WHATSAPP_AGENT_DATABASE_URL in Vercel." };
  }
  try {
    await db()`
      insert into tenants (slug, name, kind, whatsapp_phone_number_id, whatsapp_display_number, owner_phone, address,
        opening_hours, dashboard_password_hash)
      values (${input.slug}, ${input.name}, ${input.kind}, ${input.whatsappPhoneNumberId},
        ${input.whatsappDisplayNumber ?? null}, ${input.ownerPhone ?? null}, ${input.address ?? ""},
        ${db().json(defaultHours)}, ${hashPassword(password)})`;
    return { ok: true, slug: input.slug, password };
  } catch (err) {
    const code = (err as { code?: string; constraint_name?: string }).code;
    if (code === "23505") {
      const constraint = (err as { constraint_name?: string }).constraint_name ?? "";
      return {
        ok: false,
        error: constraint.includes("phone")
          ? "Another business already uses that WhatsApp phone number ID."
          : "That web address is already used by another business.",
      };
    }
    console.error("[admin] failed to add business", err);
    return { ok: false, error: "The business could not be saved. Check the sales agent's database connection." };
  }
}
