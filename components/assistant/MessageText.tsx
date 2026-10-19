import { Fragment, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/** Renders **bold**, bare /internal paths, emails and URLs as links. */
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+|(?<![\w/])\/(?:contact|services|projects|about|careers|insights|assistant|privacy)\b)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part))
      return (
        <a key={i} href={part.replace(/[.,]$/, "")} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {part}
        </a>
      );
    if (part.includes("@"))
      return (
        <a key={i} href={`mailto:${part.replace(/[.,]$/, "")}`} className="underline underline-offset-2" dir="ltr">
          {part}
        </a>
      );
    if (part.startsWith("/"))
      return (
        <Link key={i} href={part} className="underline underline-offset-2">
          {part}
        </Link>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Minimal formatting for assistant replies: paragraphs and "- " bullet lists. */
export function MessageText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter(Boolean);
        if (lines.length && lines.every((l) => /^\s*[-•*]\s/.test(l))) {
          return (
            <ul key={i} className="my-1 list-disc space-y-1 ps-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-•*]\s/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap [&:not(:first-child)]:mt-2">
            {inline(block)}
          </p>
        );
      })}
    </>
  );
}
