-- Create Animation Videos with AI: each day's class gets its PowerPoint slides (files in public/slides), in every intake.
UPDATE "classes" SET "slides" = jsonb_build_object(
    'file', '/academy/slides/animation-videos-with-ai/day-' || "classes"."week" || '.pptx',
    'images', (SELECT jsonb_agg('/academy/slides/animation-videos-with-ai/day-' || "classes"."week" || '/' || lpad(i::text, 2, '0') || '.webp' ORDER BY i)
               FROM generate_series(1, (ARRAY[11, 10, 10, 10, 9])["classes"."week"]) AS i))
FROM "cohorts", "courses"
WHERE "classes"."cohort_id" = "cohorts"."id" AND "cohorts"."course_id" = "courses"."id"
  AND "courses"."slug" = 'animation-videos-with-ai' AND "classes"."week" BETWEEN 1 AND 5 AND "classes"."slides" IS NULL;
