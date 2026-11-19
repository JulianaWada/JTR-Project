/**
 * Lessons that have an animated cartoon version (components/animated-lesson/lessons), by
 * "<course slug>/<lesson number>". The lesson page shows the animated lesson first and keeps any
 * video in a second tab. Keep in step with components/animated-lesson/registry.ts.
 */
export const ANIMATED_LESSON_IDS = ["boost-sales-with-ai/2"] as const;

export function animatedLessonId(courseSlug: string, week: number): string | null {
  const id = `${courseSlug}/${week}`;
  return (ANIMATED_LESSON_IDS as readonly string[]).includes(id) ? id : null;
}
