import type { BadgeKey } from "@/lib/badges";
import { cn } from "@/lib/cn";

// JTR badge medallions: a silver ring around a navy-to-electric-blue disc, like the JTR emblem, with a white line glyph.
const glyphs: Record<BadgeKey | "certificate", string> = {
  "first-class": "M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10.5 9.2v5.6l4.6-2.8z",
  "first-assignment": "M5 19l1-4L15.5 5.5l3 3L9 18zM13.5 7.5l3 3M5 19h14",
  "quiz-ace": "M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 12h.01",
  halfway: "M3.5 19l6-9 3.5 4.5 2-2.5 5.5 7zM9.5 10V4.5l4 1.5-4 1.5",
  "perfect-attendance": "M12 4l2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 19l1-5.4-4-3.8 5.4-.7z",
  "final-project": "M8 4.5h8V9a4 4 0 0 1-8 0zM8 6.5H5.5v.5A3 3 0 0 0 8 10M16 6.5h2.5v.5A3 3 0 0 1 16 10M12 13v3.5M9 19.5h6M10 16.5h4v3h-4z",
  graduate: "M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.5v4c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4M20 10v5",
  certificate: "M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.5v4c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4M20 10v5",
};

/** A badge medallion. `earned={false}` shows it greyed out, for badges still to come. */
export function BadgeIcon({ badge, earned = true, className = "size-10" }: { badge: BadgeKey | "certificate"; earned?: boolean; className?: string }) {
  const key = earned ? "on" : "off";
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("shrink-0", className)}>
      <defs>
        <linearGradient id={`jtr-badge-ring-${key}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={earned ? "#f4f7fb" : "#e5e7eb"} />
          <stop offset="0.5" stopColor={earned ? "#a9b6c8" : "#c4c8cf"} />
          <stop offset="1" stopColor={earned ? "#e2e8f0" : "#d9dce1"} />
        </linearGradient>
        <linearGradient id={`jtr-badge-disc-${key}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={earned ? "#0a1a33" : "#9ca3af"} />
          <stop offset="1" stopColor={earned ? "#1563d6" : "#cbd0d8"} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill={`url(#jtr-badge-ring-${key})`} />
      <circle cx="24" cy="24" r="19" fill={`url(#jtr-badge-disc-${key})`} />
      <path d="M9 18a16 16 0 0 1 30 0" fill="none" stroke="#fff" strokeOpacity={earned ? 0.18 : 0.3} strokeWidth="1.5" strokeLinecap="round" />
      <g transform="translate(12 12)">
        <path d={glyphs[badge]} fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
