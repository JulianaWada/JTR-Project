-- Create Animation Videos with AI: each day's class gets its PowerPoint slides (files in public/slides), in every intake.
UPDATE "classes" SET "slides" = jsonb_build_object(
    'file', '/academy/slides/animation-videos-with-ai/day-' || "classes"."week" || '.pptx',
    'images', (SELECT jsonb_agg('/academy/slides/animation-videos-with-ai/day-' || "classes"."week" || '/' || lpad(i::text, 2, '0') || '.webp' ORDER BY i)
               FROM generate_series(1, (ARRAY[11, 10, 10, 10, 9])["classes"."week"]) AS i))
FROM "cohorts", "courses"
WHERE "classes"."cohort_id" = "cohorts"."id" AND "cohorts"."course_id" = "courses"."id"
  AND "courses"."slug" = 'animation-videos-with-ai' AND "classes"."week" BETWEEN 1 AND 5 AND "classes"."slides" IS NULL;
--> statement-breakpoint
-- Digen AI is the course's AI generator (images, image to video, lip sync, text to speech). Only text Jules hasn't edited changes.
UPDATE "classes" SET "notes" = replace(replace(replace(replace(replace("classes"."notes",
    '- Images and characters: an AI image generator', '- Images and characters: Digen AI (text to image)'),
    '- Animation: an AI video generator (image-to-video) or a simple animation app such as CapCut or Canva', '- Animation: Digen AI (image to video, and lip sync for talking characters) or a simple animation app such as CapCut or Canva'),
    '- Voice: an AI voice generator, or record your own on your phone', '- Voice: Digen AI text to speech, or record your own on your phone'),
    '- **Image-to-video AI:** upload a still image and describe the motion', '- **Image to video in Digen AI:** upload a still image and describe the motion'),
    'or use an AI voice. Speak a little slower', 'or use Digen AI text to speech. Speak a little slower')
FROM "cohorts", "courses"
WHERE "classes"."cohort_id" = "cohorts"."id" AND "cohorts"."course_id" = "courses"."id" AND "courses"."slug" = 'animation-videos-with-ai';--> statement-breakpoint
-- Digen AI links on each day: images (days 1 and 2), image to video (days 1 and 3), lip sync and voice (day 4). Skipped where the link is already there.
UPDATE "classes" SET "resources" = (CASE "classes"."week"
    WHEN 1 THEN '[{"label": "Digen AI: text to image", "url": "https://digen.ai/image"}, {"label": "Digen AI: image to video", "url": "https://digen.ai/en/space"}]'
    WHEN 2 THEN '[{"label": "Digen AI: text to image", "url": "https://digen.ai/image"}]'
    WHEN 3 THEN '[{"label": "Digen AI: image to video", "url": "https://digen.ai/en/space"}]'
    ELSE '[{"label": "Digen AI: lip sync and text to speech", "url": "https://digen.ai/create"}]' END)::jsonb || "classes"."resources"
FROM "cohorts", "courses"
WHERE "classes"."cohort_id" = "cohorts"."id" AND "cohorts"."course_id" = "courses"."id" AND "courses"."slug" = 'animation-videos-with-ai'
  AND "classes"."week" BETWEEN 1 AND 4 AND NOT "classes"."resources"::text LIKE '%digen.ai/%';
