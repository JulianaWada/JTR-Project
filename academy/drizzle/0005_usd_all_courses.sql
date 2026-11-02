-- Every course gets a dollar price for students outside Nigeria, at the same rate as the animation course (N50,000 = $35), rounded to whole dollars.
UPDATE "courses" SET "price_usd_cents" = GREATEST(100, ROUND("price_kobo" * 35.0 / 5000000) * 100) WHERE "price_usd_cents" IS NULL AND "price_kobo" > 0;
