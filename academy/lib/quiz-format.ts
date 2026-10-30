import type { QuizQuestion } from "@/lib/db/schema";

// Quizzes are edited as plain text so no special editor is needed:
//
//   Q: Which shape is best for Reels?
//   - 16:9
//   * 9:16 vertical      (the star marks the right answer)
//   - 1:1

export function quizToText(questions: QuizQuestion[]) {
  return questions
    .map((q) => [`Q: ${q.question}`, ...q.options.map((o, i) => `${i === q.answer ? "*" : "-"} ${o}`)].join("\n"))
    .join("\n\n");
}

export function parseQuiz(text: string): { questions: QuizQuestion[] } | { error: string } {
  const questions: QuizQuestion[] = [];
  let current: { question: string; options: string[]; answer: number } | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^q:/i.test(line)) {
      if (current) questions.push(current);
      current = { question: line.slice(2).trim(), options: [], answer: -1 };
    } else if (current && (line.startsWith("-") || line.startsWith("*"))) {
      if (line.startsWith("*")) current.answer = current.options.length;
      current.options.push(line.slice(1).trim());
    } else {
      return { error: `I couldn't read this line: "${line}". Start questions with "Q:" and answers with "-" or "*".` };
    }
  }
  if (current) questions.push(current);
  if (!questions.length) return { error: "Add at least one question." };
  for (const q of questions) {
    if (q.options.length < 2) return { error: `"${q.question}" needs at least two answers.` };
    if (q.answer < 0) return { error: `Mark the right answer for "${q.question}" with a *.` };
  }
  return { questions };
}

export function resourcesToText(resources: { label: string; url: string }[]) {
  return resources.map((r) => `${r.label} | ${r.url}`).join("\n");
}

export function parseResources(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, url] = l.includes("|") ? l.split("|").map((s) => s.trim()) : [l, l];
      return { label: label || url, url };
    })
    .filter((r) => /^https?:\/\//.test(r.url));
}
