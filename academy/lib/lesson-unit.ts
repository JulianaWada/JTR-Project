import type { LessonUnit } from "@/lib/db/schema";

/**
 * What a class is called on screen: "Lesson" for a recorded course's videos,
 * "Day" for a short daily live course, "Week" for a weekly one.
 */
export function lessonLabel(course: { lessonUnit?: LessonUnit | null } | null | undefined, selfPaced = false) {
  if (selfPaced) return "Lesson";
  return course?.lessonUnit === "day" ? "Day" : "Week";
}
