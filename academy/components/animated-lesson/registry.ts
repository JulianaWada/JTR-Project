import { boostSalesLesson1 } from "./lessons/boost-sales-1";
import { boostSalesLesson2 } from "./lessons/boost-sales-2";
import { boostSalesLesson3 } from "./lessons/boost-sales-3";
import { boostSalesLesson4 } from "./lessons/boost-sales-4";
import { boostSalesLesson5 } from "./lessons/boost-sales-5";
import { boostSalesLesson6 } from "./lessons/boost-sales-6";
import type { AnimatedLesson } from "./types";

/** Every animated lesson, by "<course slug>/<lesson number>". Keep in step with lib/animated-lessons.ts. */
export const ANIMATED_LESSONS: Record<string, AnimatedLesson> = Object.fromEntries(
  [boostSalesLesson1, boostSalesLesson2, boostSalesLesson3, boostSalesLesson4, boostSalesLesson5, boostSalesLesson6].map((l) => [l.id, l]),
);
