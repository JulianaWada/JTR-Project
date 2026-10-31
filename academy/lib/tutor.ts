import Anthropic from "@anthropic-ai/sdk";
import { and, asc, count, desc, eq, gte } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { assignments, classes, cohorts, courses, tutorMessages } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { addDays } from "@/lib/time";

export const DAILY_QUESTION_LIMIT = 40;
const HISTORY_MESSAGES = 20;

type Material = { courseTitle: string; lessons: { week: number; title: string; notes: string }[]; assignments: { week: number; title: string; brief: string }[] };

async function loadMaterial(db: Database, cohortId: string): Promise<Material> {
  const cohort = (await db.query.cohorts.findFirst({ where: eq(cohorts.id, cohortId) }))!;
  const course = (await db.query.courses.findFirst({ where: eq(courses.id, cohort.courseId) }))!;
  const lessons = await db.query.classes.findMany({ where: eq(classes.cohortId, cohortId), orderBy: asc(classes.week) });
  const tasks = await db.query.assignments.findMany({ where: eq(assignments.courseId, course.id), orderBy: asc(assignments.week) });
  return { courseTitle: course.title, lessons, assignments: tasks };
}

export function tutorSystemPrompt(m: Material) {
  const lessons = m.lessons.map((l) => `<lesson week="${l.week}" title="${l.title}">\n${l.notes.trim()}\n</lesson>`).join("\n\n");
  const tasks = m.assignments.map((a) => `<assignment week="${a.week}" title="${a.title}">${a.brief}</assignment>`).join("\n");
  return `You are the AI tutor for "${m.courseTitle}", a live online course at JTR Academy taught by Jules (Jules TechRight, Nigeria). Students are mostly Nigerian business owners and creators, many new to AI.

How to help:
- Answer from the course material below first, and say which week covers it so students can revisit the notes and recording.
- You may add practical general knowledge when the notes don't cover something, and say so.
- Use plain, friendly English, short paragraphs and Nigerian examples (naira prices, WhatsApp, Instagram, Lagos and Abuja businesses).
- For assignments, coach: ask questions, give examples and feedback on drafts, but don't write the whole submission for the student.
- If a question is about payments, certificates, class times or anything you can't see, tell them to message Jules.
- Keep answers under about 200 words unless the student asks for more.

<course_material>
${lessons}

${tasks}
</course_material>`;
}

let client: Anthropic | null = null;

async function claudeAnswer(system: string, history: { role: "user" | "assistant"; content: string }[]) {
  client ??= new Anthropic({ apiKey: env.anthropicApiKey });
  const response = await client.beta.messages.create({
    model: env.tutorModel,
    max_tokens: 4000,
    // Chat: short answers, latency matters.
    output_config: { effort: "low" },
    // If a safety classifier declines, the request is retried on a fallback model server-side.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    // The course material is the same for every question in a cohort, so it is cached.
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: history,
    cache_control: { type: "ephemeral" },
  });
  if (response.stop_reason === "refusal") return "Sorry, I can't help with that one. Please ask Jules in class.";
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return text || "Sorry, I didn't catch that. Could you ask again in a different way?";
}

const STOP_WORDS = new Set(
  "a an and are as at be but by can do does for from how i if in is it me my of on or so that the this to was what when where which who why will with you your".split(" "),
);

function words(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9₦ ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Test mode: finds the best-matching section of the notes, so the demo still feels useful. */
export function mockAnswer(m: Material, question: string) {
  const asked = new Set(words(question));
  let best: { score: number; week: number; heading: string; body: string } | null = null;
  for (const lesson of m.lessons) {
    for (const section of lesson.notes.split(/^## /m).filter(Boolean)) {
      const [heading, ...rest] = section.split("\n");
      const body = rest.join("\n").trim();
      const score = words(`${heading} ${heading} ${body}`).filter((w) => asked.has(w)).length;
      if (!best || score > best.score) best = { score, week: lesson.week, heading: heading.trim(), body };
    }
  }
  if (!best || best.score === 0) {
    return `(Test mode: the AI tutor answers properly once the Claude API key is added.)\n\nI couldn't find that in the ${m.courseTitle} notes yet. Try asking about a topic from one of the weeks, or bring the question to the next live class.`;
  }
  const excerpt = best.body.replace(/\*\*/g, "").split("\n").slice(0, 6).join("\n");
  return `(Test mode: this answer is taken straight from the notes. With the Claude API key added, the tutor explains in its own words.)\n\nWeek ${best.week} covers this under "${best.heading}":\n\n${excerpt}`;
}

export async function questionsToday(db: Database, userId: string, now = new Date()) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(tutorMessages)
    .where(and(eq(tutorMessages.userId, userId), eq(tutorMessages.role, "user"), gte(tutorMessages.createdAt, addDays(now, -1))));
  return value;
}

/** Saves the question, asks Claude (or the test-mode tutor) and saves the answer. */
export async function askTutor(db: Database, userId: string, cohortId: string, question: string) {
  const text = question.trim().slice(0, 2000);
  if (!text) return { error: "Type a question first." };
  if ((await questionsToday(db, userId)) >= DAILY_QUESTION_LIMIT) {
    return { error: `You've asked ${DAILY_QUESTION_LIMIT} questions in the last 24 hours. Please try again tomorrow.` };
  }
  const material = await loadMaterial(db, cohortId);
  const previous = await db.query.tutorMessages.findMany({
    where: and(eq(tutorMessages.userId, userId), eq(tutorMessages.cohortId, cohortId)),
    orderBy: desc(tutorMessages.createdAt),
    limit: HISTORY_MESSAGES,
  });
  const history = previous.reverse().map((m) => ({ role: m.role, content: m.content }));
  // The conversation must start with the student.
  while (history.length && history[0].role !== "user") history.shift();
  await db.insert(tutorMessages).values({ userId, cohortId, role: "user", content: text });

  let answer: string;
  if (env.anthropicApiKey) {
    try {
      answer = await claudeAnswer(tutorSystemPrompt(material), [...history, { role: "user", content: text }]);
    } catch (err) {
      console.error("[tutor] Claude request failed", err);
      answer = "Sorry, the tutor is having trouble right now. Please try again in a few minutes.";
    }
  } else {
    answer = mockAnswer(material, text);
  }
  await db.insert(tutorMessages).values({ userId, cohortId, role: "assistant", content: answer });
  return { answer };
}
