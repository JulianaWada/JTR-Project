-- Jules (19 Nov 2026): launch price for the recorded course Boost Sales with AI.
-- N15,000 in Nigeria, $39 everywhere else (Paystack can't charge in pounds, so UK students pay $39, about GBP 29).
-- Payments already made keep the amount they were charged. Discount codes (such as the 80% student code) still apply.
UPDATE "courses" SET "price_kobo" = 1500000, "price_usd_cents" = 3900 WHERE "slug" = 'boost-sales-with-ai';
