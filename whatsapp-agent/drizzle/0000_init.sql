CREATE TABLE "agent_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"role" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"code" text NOT NULL,
	"item_id" uuid,
	"service_name" text NOT NULL,
	"price_kobo" integer NOT NULL,
	"deposit_kobo" integer DEFAULT 0 NOT NULL,
	"customer_name" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"notes" text,
	"status" text NOT NULL,
	"reminder_day_before_sent_at" timestamp with time zone,
	"reminder_same_day_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_kobo" integer NOT NULL,
	"duration_minutes" integer,
	"available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"wa_id" text NOT NULL,
	"profile_name" text,
	"name" text,
	"simulated" boolean DEFAULT false NOT NULL,
	"mode" text DEFAULT 'ai' NOT NULL,
	"handover_reason" text,
	"needs_attention" boolean DEFAULT false NOT NULL,
	"opted_out" boolean DEFAULT false NOT NULL,
	"privacy_notice_sent_at" timestamp with time zone,
	"last_inbound_at" timestamp with time zone,
	"last_message_at" timestamp with time zone,
	"agent_lease_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"author" text NOT NULL,
	"body" text NOT NULL,
	"wa_message_id" text,
	"status" text NOT NULL,
	"error" text,
	"seen_by_agent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_wa_message_id_unique" UNIQUE("wa_message_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"code" text NOT NULL,
	"lines" jsonb NOT NULL,
	"subtotal_kobo" integer NOT NULL,
	"delivery_fee_kobo" integer DEFAULT 0 NOT NULL,
	"total_kobo" integer NOT NULL,
	"fulfilment" text NOT NULL,
	"delivery_address" text,
	"notes" text,
	"status" text NOT NULL,
	"payment_reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid,
	"booking_id" uuid,
	"reference" text NOT NULL,
	"amount_kobo" integer NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"authorization_url" text NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'other' NOT NULL,
	"whatsapp_phone_number_id" text NOT NULL,
	"whatsapp_display_number" text,
	"owner_phone" text,
	"address" text DEFAULT '' NOT NULL,
	"info" text DEFAULT '' NOT NULL,
	"opening_hours" jsonb NOT NULL,
	"booking_capacity" integer DEFAULT 1 NOT NULL,
	"booking_deposit_percent" integer DEFAULT 0 NOT NULL,
	"delivery_fee_kobo" integer DEFAULT 0 NOT NULL,
	"offers_delivery" boolean DEFAULT false NOT NULL,
	"offers_pickup" boolean DEFAULT true NOT NULL,
	"paystack_subaccount" text,
	"dashboard_password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tenants_whatsapp_phone_number_id_unique" UNIQUE("whatsapp_phone_number_id")
);
--> statement-breakpoint
ALTER TABLE "agent_turns" ADD CONSTRAINT "agent_turns_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_item_id_catalog_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."catalog_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_turns_customer_seq_idx" ON "agent_turns" USING btree ("customer_id","seq");--> statement-breakpoint
CREATE INDEX "bookings_tenant_start_idx" ON "bookings" USING btree ("tenant_id","starts_at");--> statement-breakpoint
CREATE INDEX "catalog_items_tenant_idx" ON "catalog_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_tenant_wa_idx" ON "customers" USING btree ("tenant_id","wa_id");--> statement-breakpoint
CREATE INDEX "messages_customer_idx" ON "messages" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_tenant_idx" ON "orders" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_tenant_idx" ON "payments" USING btree ("tenant_id","created_at");