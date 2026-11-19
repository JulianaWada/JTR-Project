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
import { VOICE_SECONDS } from "./voice";

/**
 * Gives each step its recorded narration (public/lessons/<lesson id>/step-NN.mp3) when the lesson has one.
 * The recording must have exactly one file per step, or the lesson keeps the browser voice.
 */
function withVoice(lesson: AnimatedLesson): AnimatedLesson {
  const seconds = VOICE_SECONDS[lesson.id];
  const total = lesson.scenes.reduce((n, s) => n + s.steps.length, 0);
  if (!seconds || seconds.length !== total) return lesson;
  let n = 0;
  return {
    ...lesson,
    scenes: lesson.scenes.map((scene) => ({
      ...scene,
      steps: scene.steps.map((step) => {
        n += 1;
        return step.audio ? step : { ...step, audio: `/academy/lessons/${lesson.id}/step-${String(n).padStart(2, "0")}.mp3`, seconds: seconds[n - 1] };
      }),
    })),
  };
}

/** Every animated lesson, by "<course slug>/<lesson number>". Keep in step with lib/animated-lessons.ts. */
export const ANIMATED_LESSONS: Record<string, AnimatedLesson> = Object.fromEntries(
  [boostSalesLesson1, boostSalesLesson2, boostSalesLesson3, boostSalesLesson4, boostSalesLesson5, boostSalesLesson6, ...[aiAgentsLesson1, aiAgentsLesson2, aiAgentsLesson3, aiAgentsLesson4, aiAgentsLesson5, aiAgentsLesson6].map(withCourseFrame)].map((l) => [l.id, withVoice(l)]),
);
