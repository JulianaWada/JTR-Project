-- Jules (18 Nov 2026): take the live course, Create Animation Videos with AI, off the academy for now.
-- It is only unpublished: intakes, enrolments and lesson material stay, students who already paid keep access,
-- and ticking "Published" on the course in Teach > Courses brings it back.
UPDATE "courses" SET "published" = false WHERE "slug" = 'animation-videos-with-ai';
