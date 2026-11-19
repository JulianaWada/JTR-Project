/**
 * Lessons that have an animated cartoon version (components/animated-lesson/lessons), by
 * "<course slug>/<lesson number>". The lesson page shows the animated lesson first and keeps any
 * video in a second tab. Keep in step with components/animated-lesson/registry.ts.
 */
export const ANIMATED_LESSON_IDS = [1, 2, 3, 4, 5, 6].flatMap((n) => [`boost-sales-with-ai/${n}`, `ai-agents-without-code/${n}`]);

export function animatedLessonId(courseSlug: string, week: number): string | null {
  const id = `${courseSlug}/${week}`;
  return ANIMATED_LESSON_IDS.includes(id) ? id : null;
}
