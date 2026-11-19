import { ANIMATED_LESSONS } from "../../components/animated-lesson/registry";
const out: Record<string, Record<string, string[]>> = {};
for (const [id, lesson] of Object.entries(ANIMATED_LESSONS)) {
  const [course, n] = id.split("/");
  (out[course] ??= {})[n] = lesson.scenes.flatMap((s) => s.steps.map((st) => st.say));
}
console.log(JSON.stringify(out, null, 1));
