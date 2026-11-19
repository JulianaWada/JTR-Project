import { ANIMATED_LESSONS } from "../../components/animated-lesson/registry";
const out: Record<string, string[]> = {};
for (let n = 1; n <= 6; n++) out[n] = ANIMATED_LESSONS[`boost-sales-with-ai/${n}`].scenes.flatMap((s) => s.steps.map((st) => st.say));
console.log(JSON.stringify({ "boost-sales-with-ai": out }, null, 1));
