-- Ready for real students: removes the sample people and links the first start used to add. Real signups are untouched.
-- The demo students' enrolments, payments, work, badges, certificates and tutor chats go with them (cascade).
DELETE FROM "users" WHERE "email" IN ('ada@example.com', 'tunde@example.com', 'chioma@example.com');--> statement-breakpoint
DELETE FROM "certificates" WHERE "code" = 'JTR-DEMO7';--> statement-breakpoint
DELETE FROM "emails" WHERE "to" LIKE '%@example.com';--> statement-breakpoint
-- The finished sample intake, if nobody real joined it.
DELETE FROM "cohorts" WHERE "meet_url" = 'https://meet.google.com/jtr-demo-class' AND "starts_at" < now() AND NOT EXISTS (SELECT 1 FROM "enrolments" e WHERE e."cohort_id" = "cohorts"."id");--> statement-breakpoint
-- Upcoming intakes stay, but without the made-up Meet link and recordings: the dashboard asks for real ones.
UPDATE "cohorts" SET "meet_url" = '' WHERE "meet_url" = 'https://meet.google.com/jtr-demo-class';--> statement-breakpoint
UPDATE "classes" SET "recording_url" = NULL WHERE "recording_url" = 'https://drive.google.com/file/d/demo-recording/view';--> statement-breakpoint
DELETE FROM "discount_codes" WHERE "code" = 'EARLYBIRD' AND "uses" = 0;
