"use client";

import { useEffect, useState } from "react";
import { withCourseFrame } from "./lessons/ai-agents-frame";
import type { AnimatedLesson } from "./types";
import { withVoice } from "./with-voice";

/**
 * Each lesson is its own download: the lesson page fetches only the lesson being watched, so the scripts of the
 * other lessons (and courses) never reach a student's browser. Keep in step with registry.ts and lib/animated-lessons.ts.
 */
const LOADERS: Record<string, () => Promise<AnimatedLesson>> = {
  "boost-sales-with-ai/1": () => import("./lessons/boost-sales-1").then((m) => m.boostSalesLesson1),
  "boost-sales-with-ai/2": () => import("./lessons/boost-sales-2").then((m) => m.boostSalesLesson2),
  "boost-sales-with-ai/3": () => import("./lessons/boost-sales-3").then((m) => m.boostSalesLesson3),
  "boost-sales-with-ai/4": () => import("./lessons/boost-sales-4").then((m) => m.boostSalesLesson4),
  "boost-sales-with-ai/5": () => import("./lessons/boost-sales-5").then((m) => m.boostSalesLesson5),
  "boost-sales-with-ai/6": () => import("./lessons/boost-sales-6").then((m) => m.boostSalesLesson6),
  "ai-agents-without-code/1": () => import("./lessons/ai-agents-1").then((m) => withCourseFrame(m.aiAgentsLesson1)),
  "ai-agents-without-code/2": () => import("./lessons/ai-agents-2").then((m) => withCourseFrame(m.aiAgentsLesson2)),
  "ai-agents-without-code/3": () => import("./lessons/ai-agents-3").then((m) => withCourseFrame(m.aiAgentsLesson3)),
  "ai-agents-without-code/4": () => import("./lessons/ai-agents-4").then((m) => withCourseFrame(m.aiAgentsLesson4)),
  "ai-agents-without-code/5": () => import("./lessons/ai-agents-5").then((m) => withCourseFrame(m.aiAgentsLesson5)),
  "ai-agents-without-code/6": () => import("./lessons/ai-agents-6").then((m) => withCourseFrame(m.aiAgentsLesson6)),
};

export const LOADABLE_LESSON_IDS = Object.keys(LOADERS);

/** The animated lesson, once its download has arrived (undefined while loading, null if there is no such lesson). */
export function useAnimatedLesson(lessonId: string): AnimatedLesson | null | undefined {
  const [lesson, setLesson] = useState<{ id: string; value: AnimatedLesson | null }>();
  useEffect(() => {
    let live = true;
    const load = LOADERS[lessonId] ?? (() => Promise.reject(new Error("No such lesson")));
    load().then(
      (l) => live && setLesson({ id: lessonId, value: withVoice(l) }),
      () => live && setLesson({ id: lessonId, value: null }),
    );
    return () => {
      live = false;
    };
  }, [lessonId]);
  return lesson?.id === lessonId ? lesson.value : undefined;
}
