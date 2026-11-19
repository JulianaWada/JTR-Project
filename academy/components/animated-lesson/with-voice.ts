import type { AnimatedLesson } from "./types";
import { VOICE_SECONDS } from "./voice";

/**
 * Gives each step its recorded narration (private/lessons/<lesson id>/step-NN.mp3) when the lesson has one.
 * The recording must have exactly one file per step, or the lesson keeps the browser voice.
 */
export function withVoice(lesson: AnimatedLesson): AnimatedLesson {
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
