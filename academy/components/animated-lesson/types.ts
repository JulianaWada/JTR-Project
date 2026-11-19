import type { ComponentType } from "react";

/** One thing the narrator says, and the moment the picture changes to show it. */
export type NarrationStep = {
  say: string;
  /** Optional recorded voice for this step (for example the teacher's own voice). Without it the browser reads `say` aloud. */
  audio?: string;
};

export type SceneProps = {
  /** Which narration step is playing (0 = the first). Each scene shows what that step talks about. */
  step: number;
  /** True while the narrator is speaking, so the presenter's mouth moves. */
  talking: boolean;
};

export type AnimatedScene = {
  heading: string;
  steps: NarrationStep[];
  Scene: ComponentType<SceneProps>;
  /** A prompt students can copy and try in ChatGPT or Claude after this scene. */
  tryIt?: string;
};

export type AnimatedLesson = {
  id: string;
  title: string;
  scenes: AnimatedScene[];
};
