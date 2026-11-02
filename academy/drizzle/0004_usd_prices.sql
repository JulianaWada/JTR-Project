ALTER TABLE "courses" ADD COLUMN "price_usd_cents" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "currency" text DEFAULT 'NGN' NOT NULL;--> statement-breakpoint
-- Create Animation Videos with AI: $35 for students paying from outside Nigeria (matches the UK flyer).
UPDATE "courses" SET "price_usd_cents" = 3500 WHERE "slug" = 'animation-videos-with-ai' AND "price_usd_cents" IS NULL;
