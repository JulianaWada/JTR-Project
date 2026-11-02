ALTER TABLE "courses" ADD COLUMN "lesson_unit" text DEFAULT 'week' NOT NULL;--> statement-breakpoint
-- Create Animation Videos with AI becomes a five-day course (one two-hour class a day, Day 1 to Day 5).
-- Each change only applies where Jules hasn't already edited that part in the teacher dashboard.
UPDATE "courses" SET "lesson_unit" = 'day' WHERE "slug" = 'animation-videos-with-ai' AND "format" = 'live';--> statement-breakpoint
UPDATE "courses" SET "description" = 'A hands-on five-day live course, one two-hour class a day. You''ll learn how short animated videos are planned, then use AI tools to write the script, create characters and scenes, animate them, and add voice and music. By the end you''ll have finished your own 30 to 60 second animated video. No drawing or editing experience needed.' WHERE "slug" = 'animation-videos-with-ai' AND "description" = 'A hands-on six-week live course. You''ll learn how short animated videos are planned, then use AI tools to write the script, create characters and scenes, animate them, and add voice and music. By the end you''ll have finished your own 30 to 60 second animated video. No drawing or editing experience needed.';--> statement-breakpoint
UPDATE "courses" SET "outline" = '[{"week":1,"title":"Script and storyboard","summary":"What makes a great short video, then writing the script and storyboard with AI."},{"week":2,"title":"Characters and scenes","summary":"Creating consistent characters, backgrounds and props."},{"week":3,"title":"Bring it to life","summary":"Animating scenes, camera moves and transitions."},{"week":4,"title":"Sound and finishing","summary":"Voiceover, music, captions and editing."},{"week":5,"title":"Showcase","summary":"Final project: your own 30 to 60 second animated video."}]'::jsonb WHERE "slug" = 'animation-videos-with-ai' AND "outline" = '[{"week":1,"title":"What makes a great short video","summary":"Hooks, length and formats, plus a tour of AI video and animation tools."},{"week":2,"title":"Script and storyboard","summary":"Writing a script and turning it into a storyboard with AI."},{"week":3,"title":"Characters and scenes","summary":"Creating consistent characters, backgrounds and props."},{"week":4,"title":"Bring it to life","summary":"Animating scenes, camera moves and transitions."},{"week":5,"title":"Sound and finishing","summary":"Voiceover, music, captions and editing."},{"week":6,"title":"Showcase","summary":"Final project: your own 30 to 60 second animated video."}]'::jsonb;--> statement-breakpoint
UPDATE "assignments" a SET "week" = v.new_week
FROM (VALUES ('Script and storyboard', 2, 1), ('Character sheet', 3, 2), ('Final project: your animated video', 6, 5)) AS v(title, old_week, new_week), "courses" c
WHERE a."course_id" = c."id" AND c."slug" = 'animation-videos-with-ai' AND a."title" = v.title AND a."week" = v.old_week;--> statement-breakpoint
UPDATE "quizzes" qz SET "week" = 2 FROM "courses" c
WHERE qz."course_id" = c."id" AND c."slug" = 'animation-videos-with-ai' AND qz."title" = 'Characters quiz' AND qz."week" = 3;--> statement-breakpoint
-- The upcoming intake the first start created ("January 2027", six weekly classes) becomes
-- "December 2026": five daily classes from Tuesday 1 December, 4pm to 6pm Lagos time.
-- Skipped if anyone has enrolled in it or its classes were changed.
DO $migrate$
DECLARE target uuid;
BEGIN
  SELECT co."id" INTO target
  FROM "cohorts" co JOIN "courses" c ON c."id" = co."course_id"
  WHERE c."slug" = 'animation-videos-with-ai' AND co."name" = 'January 2027' AND NOT co."self_paced"
    AND now() < timestamptz '2026-12-01 16:00+01'
    AND NOT EXISTS (SELECT 1 FROM "enrolments" e WHERE e."cohort_id" = co."id")
    AND (SELECT count(*) FROM "classes" cl WHERE cl."cohort_id" = co."id") = 6
    AND EXISTS (SELECT 1 FROM "classes" cl WHERE cl."cohort_id" = co."id" AND cl."week" = 1 AND cl."title" = 'What makes a great short video')
  LIMIT 1;
  IF target IS NULL THEN RETURN; END IF;

  UPDATE "classes" SET "notes" = $notes$## The first 3 seconds
On TikTok, Instagram Reels and YouTube Shorts people decide in about 3 seconds whether to keep watching. Start with movement, a question or a surprising image, never with a logo.

## Length and format
- Adverts: 15 to 30 seconds
- Explainers: 45 to 90 seconds
- Vertical 9:16 for phones, square 1:1 for feeds, 16:9 for YouTube and presentations

## The AI toolkit
- Script: ChatGPT or Claude
- Images and characters: an AI image generator
- Animation: an AI video generator (image-to-video) or a simple animation app such as CapCut or Canva
- Voice: an AI voice generator, or record your own on your phone
- Editing: CapCut or Canva

## One video, one message
Decide the single thing the viewer should remember or do. Write it in one sentence before anything else.

## Writing the script with AI
Prompt: "Write a 30-second animated video script for [business]. Audience: [who]. Message: [one sentence]. Include a 3-second hook, 3 short scenes and a call to action. Show visuals and narration in two columns."

## Storyboard
A storyboard is a list of frames: what we see, what we hear, and how long it lasts. Ask AI to turn the script into a table with Scene, Visual, Narration and Seconds. A 30-second video usually has 5 to 8 scenes.

## Exercise
Write your script and storyboard for your final project idea. Before the next class, watch 5 animated adverts you like and note what happens in the first 3 seconds.$notes$, "resources" = '[{"label":"CapCut","url":"https://www.capcut.com"},{"label":"Canva","url":"https://www.canva.com"}]'::jsonb
  WHERE "cohort_id" = target AND "week" = 2 AND "title" = 'Script and storyboard';
  DELETE FROM "classes" WHERE "cohort_id" = target AND "week" = 1;
  UPDATE "classes"
  SET "week" = "week" - 1,
      "starts_at" = timestamptz '2026-12-01 16:00+01' + ("week" - 2) * interval '1 day',
      "duration_minutes" = 120,
      "reminder_sent_at" = NULL
  WHERE "cohort_id" = target;
  UPDATE "cohorts" SET "name" = 'December 2026', "starts_at" = timestamptz '2026-12-01 16:00+01' WHERE "id" = target;
END
$migrate$;
