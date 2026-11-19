"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandBadge } from "./cartoon";
import { useAnimatedLesson } from "./load";
import type { AnimatedLesson } from "./types";

/** Silence after each step, matching the player and the audio track built for the video. */
export const STEP_GAP_SECONDS = 0.7;

/** How long a step is shown in the clean video (its recorded audio, or reading speed). */
export function stepSeconds(step: { say: string; seconds?: number }) {
  return step.seconds ?? step.say.split(/\s+/).length * 0.39 + 0.9;
}

/**
 * The lesson full screen with no controls, for recording a clean MP4 (scripts/render-lesson-video.mjs).
 * Playback starts when the recorder calls window.startLesson(); the title becomes "done" at the end.
 */
export function CleanLessonRender({ lessonId }: { lessonId: string }) {
  const lesson = useAnimatedLesson(lessonId);
  return lesson ? <CleanRender lesson={lesson} /> : null;
}

function CleanRender({ lesson }: { lesson: AnimatedLesson }) {
  const flat = useMemo(() => (lesson?.scenes ?? []).flatMap((s, scene) => s.steps.map((st, step) => ({ scene, step, secs: stepSeconds(st) }))), [lesson]);
  const [i, setI] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const running = startedAt > 0;
  const [quietAt, setQuietAt] = useState(-1);

  useEffect(() => {
    (window as unknown as { startLesson: () => void }).startLesson = () => setStartedAt(performance.now());
    // ?step=N shows the Nth narration step (counted from 0) without playing, for checking scenes.
    const at = Number(new URLSearchParams(window.location.search).get("step"));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after hydration (dev-only page)
    if (at > 0) setI(at);
  }, []);

  useEffect(() => {
    if (!running) return;
    const cur = flat[i];
    if (!cur) {
      document.title = "done";
      return;
    }
    // Time each step from the start, so small timer delays never add up and drift from the audio track.
    const begin = flat.slice(0, i).reduce((t, s) => t + s.secs + STEP_GAP_SECONDS, 0) * 1000;
    const now = performance.now() - startedAt;
    const a = setTimeout(() => setQuietAt(i), begin + cur.secs * 1000 - now);
    const b = setTimeout(() => setI((n) => n + 1), begin + (cur.secs + STEP_GAP_SECONDS) * 1000 - now);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [running, startedAt, i, flat]);

  if (!lesson) return null;
  const cur = flat[Math.min(i, flat.length - 1)];
  const { Scene } = lesson.scenes[cur.scene];
  return (
    <svg viewBox="0 0 960 540" className="block h-screen w-screen bg-[#0b1a33]" role="img" aria-label={lesson.title}>
      <g key={cur.scene} className="ac-scene-in">
        <Scene step={cur.step} talking={running && quietAt !== i} />
      </g>
      <BrandBadge />
    </svg>
  );
}
