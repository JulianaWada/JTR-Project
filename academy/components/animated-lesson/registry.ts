import { boostSalesLesson2 } from "./lessons/boost-sales-2";
import type { AnimatedLesson } from "./types";

/** Every animated lesson, by "<course slug>/<lesson number>". Keep in step with lib/animated-lessons.ts. */
export const ANIMATED_LESSONS: Record<string, AnimatedLesson> = {
  [boostSalesLesson2.id]: boostSalesLesson2,
};
