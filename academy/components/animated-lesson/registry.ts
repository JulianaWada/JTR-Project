import { withCourseFrame } from "./lessons/ai-agents-frame";
import { aiAgentsLesson1 } from "./lessons/ai-agents-1";
import { aiAgentsLesson2 } from "./lessons/ai-agents-2";
import { aiAgentsLesson3 } from "./lessons/ai-agents-3";
import { aiAgentsLesson4 } from "./lessons/ai-agents-4";
import { aiAgentsLesson5 } from "./lessons/ai-agents-5";
import { aiAgentsLesson6 } from "./lessons/ai-agents-6";
import { boostSalesLesson1 } from "./lessons/boost-sales-1";
import { boostSalesLesson2 } from "./lessons/boost-sales-2";
import { boostSalesLesson3 } from "./lessons/boost-sales-3";
import { boostSalesLesson4 } from "./lessons/boost-sales-4";
import { boostSalesLesson5 } from "./lessons/boost-sales-5";
import { boostSalesLesson6 } from "./lessons/boost-sales-6";
import type { AnimatedLesson } from "./types";
import { withVoice } from "./with-voice";

/**
 * Every animated lesson, by "<course slug>/<lesson number>", for scripts only (e.g. scripts/lesson-voice).
 * Pages load one lesson at a time with useAnimatedLesson (load.ts), so a student's browser never receives the
 * other lessons. Don't import this file from a client component. Keep in step with lib/animated-lessons.ts and load.ts.
 */
export const ANIMATED_LESSONS: Record<string, AnimatedLesson> = Object.fromEntries(
  [boostSalesLesson1, boostSalesLesson2, boostSalesLesson3, boostSalesLesson4, boostSalesLesson5, boostSalesLesson6, ...[aiAgentsLesson1, aiAgentsLesson2, aiAgentsLesson3, aiAgentsLesson4, aiAgentsLesson5, aiAgentsLesson6].map(withCourseFrame)].map((l) => [l.id, withVoice(l)]),
);
