ALTER TABLE "classes" ADD COLUMN "slides" jsonb;--> statement-breakpoint
-- Boost Sales with AI: each lesson gets its PowerPoint slides (files in public/slides), in every intake.
UPDATE "classes" SET "slides" = jsonb_build_object(
    'file', '/academy/slides/boost-sales-with-ai/lesson-' || "classes"."week" || '.pptx',
    'images', (SELECT jsonb_agg('/academy/slides/boost-sales-with-ai/lesson-' || "classes"."week" || '/' || lpad(i::text, 2, '0') || '.webp' ORDER BY i)
               FROM generate_series(1, (ARRAY[10, 10, 9, 10, 10, 9])["classes"."week"]) AS i))
FROM "cohorts", "courses"
WHERE "classes"."cohort_id" = "cohorts"."id" AND "cohorts"."course_id" = "courses"."id"
  AND "courses"."slug" = 'boost-sales-with-ai' AND "classes"."week" BETWEEN 1 AND 6 AND "classes"."slides" IS NULL;
