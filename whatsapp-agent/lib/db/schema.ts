import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Money is always stored in kobo (1 naira = 100 kobo), the unit Paystack uses.
// Times are stored in UTC; the business clock is Africa/Lagos (UTC+1, no daylight saving).

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
/** Opening hours per weekday as ["09:00", "19:00"], or null when closed. */
export type OpeningHours = Record<WeekdayKey, [string, string] | null>;

export type TenantKind = "salon" | "food" | "other";

/** One business (a JTR client). One system serves many tenants. */
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  kind: text("kind").$type<TenantKind>().notNull().default("other"),
  /** Meta's phone number id for this business's WhatsApp number. Incoming webhooks are routed by it. */
  whatsappPhoneNumberId: text("whatsapp_phone_number_id").notNull().unique(),
  whatsappDisplayNumber: text("whatsapp_display_number"),
  /** Owner's WhatsApp number (international format, digits only) for hand-over alerts. */
  ownerPhone: text("owner_phone"),
  address: text("address").notNull().default(""),
  /** Free text the agent answers from: delivery areas, policies, FAQs, parking, etc. */
  info: text("info").notNull().default(""),
  openingHours: jsonb("opening_hours").$type<OpeningHours>().notNull(),
  /** How many customers can be served at the same time (chairs, stylists). */
  bookingCapacity: integer("booking_capacity").notNull().default(1),
  /** Share of a booking's price paid upfront to secure it. 0 means no payment is needed to book. */
  bookingDepositPercent: integer("booking_deposit_percent").notNull().default(0),
  deliveryFeeKobo: integer("delivery_fee_kobo").notNull().default(0),
  offersDelivery: boolean("offers_delivery").notNull().default(false),
  offersPickup: boolean("offers_pickup").notNull().default(true),
  /** Paystack subaccount code so payments settle straight to the business (optional). */
  paystackSubaccount: text("paystack_subaccount"),
  dashboardPasswordHash: text("dashboard_password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CatalogKind = "service" | "product";

/** Services (salon) or products (food vendor) with prices. */
export const catalogItems = pgTable(
  "catalog_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    kind: text("kind").$type<CatalogKind>().notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    priceKobo: integer("price_kobo").notNull(),
    /** Services only: how long an appointment takes. */
    durationMinutes: integer("duration_minutes"),
    available: boolean("available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("catalog_items_tenant_idx").on(t.tenantId)],
);

export type ChatMode = "ai" | "human";

/** A WhatsApp customer of one business. Each customer has one ongoing chat. */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    /** WhatsApp id (the phone number in international format, digits only). */
    waId: text("wa_id").notNull(),
    profileName: text("profile_name"),
    /** Name the customer gave for bookings. */
    name: text("name"),
    /** Created from the dashboard simulator: messages are never sent to WhatsApp. */
    simulated: boolean("simulated").notNull().default(false),
    mode: text("mode").$type<ChatMode>().notNull().default("ai"),
    handoverReason: text("handover_reason"),
    needsAttention: boolean("needs_attention").notNull().default(false),
    /** Customer replied STOP: no reminders or other messages they did not ask for. */
    optedOut: boolean("opted_out").notNull().default(false),
    privacyNoticeSentAt: timestamp("privacy_notice_sent_at", { withTimezone: true }),
    lastInboundAt: timestamp("last_inbound_at", { withTimezone: true }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    /** Simple lease so only one agent run per chat happens at a time. */
    agentLeaseUntil: timestamp("agent_lease_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customers_tenant_wa_idx").on(t.tenantId, t.waId)],
);

export type MessageAuthor = "customer" | "ai" | "owner" | "system";
export type MessageStatus = "received" | "pending" | "sent" | "delivered" | "read" | "failed" | "simulated";

/** Every WhatsApp message in or out, as the owner sees it in the dashboard. */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    direction: text("direction").$type<"in" | "out">().notNull(),
    author: text("author").$type<MessageAuthor>().notNull(),
    body: text("body").notNull(),
    /** WhatsApp message id (wamid). Unique, so a webhook delivered twice is handled once. */
    waMessageId: text("wa_message_id").unique(),
    status: text("status").$type<MessageStatus>().notNull(),
    error: text("error"),
    /** Inbound only: false until the agent has read it. */
    seenByAgent: boolean("seen_by_agent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_customer_idx").on(t.customerId, t.createdAt)],
);

/**
 * The exact Claude conversation for a chat, one row per API message, append-only.
 * Replaying the stored blocks byte-for-byte keeps prompt caching and thinking blocks valid.
 */
export const agentTurns = pgTable(
  "agent_turns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    role: text("role").$type<"user" | "assistant">().notNull(),
    content: jsonb("content").$type<unknown[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("agent_turns_customer_seq_idx").on(t.customerId, t.seq)],
);

export type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled"
  | "expired";

export type OrderLine = { itemId: string; name: string; quantity: number; unitPriceKobo: number };

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    /** Short code the customer and owner can quote, e.g. "OR-7K3F". */
    code: text("code").notNull().unique(),
    lines: jsonb("lines").$type<OrderLine[]>().notNull(),
    subtotalKobo: integer("subtotal_kobo").notNull(),
    deliveryFeeKobo: integer("delivery_fee_kobo").notNull().default(0),
    totalKobo: integer("total_kobo").notNull(),
    fulfilment: text("fulfilment").$type<"delivery" | "pickup">().notNull(),
    deliveryAddress: text("delivery_address"),
    notes: text("notes"),
    status: text("status").$type<OrderStatus>().notNull(),
    paymentReminderSentAt: timestamp("payment_reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_tenant_idx").on(t.tenantId, t.createdAt)],
);

export type BookingStatus = "pending_payment" | "confirmed" | "completed" | "cancelled" | "no_show" | "expired";

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    itemId: uuid("item_id").references(() => catalogItems.id, { onDelete: "set null" }),
    serviceName: text("service_name").notNull(),
    priceKobo: integer("price_kobo").notNull(),
    depositKobo: integer("deposit_kobo").notNull().default(0),
    customerName: text("customer_name").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    status: text("status").$type<BookingStatus>().notNull(),
    reminderDayBeforeSentAt: timestamp("reminder_day_before_sent_at", { withTimezone: true }),
    reminderSameDaySentAt: timestamp("reminder_same_day_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bookings_tenant_start_idx").on(t.tenantId, t.startsAt)],
);

export type PaymentStatus = "pending" | "success" | "failed" | "abandoned";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    /** Our reference, sent to Paystack and echoed back in its webhook. */
    reference: text("reference").notNull().unique(),
    amountKobo: integer("amount_kobo").notNull(),
    provider: text("provider").$type<"paystack" | "mock">().notNull(),
    status: text("status").$type<PaymentStatus>().notNull(),
    authorizationUrl: text("authorization_url").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_tenant_idx").on(t.tenantId, t.createdAt)],
);

export type Tenant = typeof tenants.$inferSelect;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
