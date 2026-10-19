import { cn } from "@/lib/cn";

/**
 * Faint angular grid used behind hero sections. Diagonal slashes echo the cut of the "R"
 * in the JTR emblem; the grid nods to woven textile geometry without being literal.
 */
export function GeoPattern({ className, id = "geo" }: { className?: string; id?: string }) {
  return (
    <svg aria-hidden="true" className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M0 56 56 0" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <path d="M0 0h56v56" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
          <path d="M14 14l8-8M34 42l8-8" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        </pattern>
        <radialGradient id={`${id}-fade`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width="100%" height="100%" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} mask={`url(#${id}-mask)`} />
    </svg>
  );
}
