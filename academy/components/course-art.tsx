import { cn } from "@/lib/cn";

/** Simple branded artwork for a course, drawn in SVG so it needs no image files. */
export function CourseArt({ slug, accent, className }: { slug: string; accent: "blue" | "violet"; className?: string }) {
  const color = accent === "violet" ? "var(--violet)" : "var(--primary)";
  const sales = slug.includes("sales");
  return (
    <div
      className={cn("relative h-40 overflow-hidden bg-navy", className)}
      style={{ background: `radial-gradient(120% 120% at 100% 0%, color-mix(in srgb, ${color} 55%, transparent), transparent 60%), #0a1a33` }}
      aria-hidden
    >
      <svg viewBox="0 0 400 160" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <g stroke="rgba(197,204,214,0.18)" strokeWidth="1">
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={i * 50} y1="0" x2={i * 50 - 80} y2="160" />
          ))}
        </g>
        {sales ? (
          <g>
            {[40, 64, 52, 88, 104, 128].map((h, i) => (
              <rect key={i} x={210 + i * 26} y={140 - h} width="16" height={h} rx="3" fill={color} opacity={0.35 + i * 0.11} />
            ))}
            <polyline points="214,108 240,90 266,98 292,64 318,50 344,22" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="344" cy="22" r="6" fill="#fff" />
          </g>
        ) : (
          <g>
            <rect x="214" y="30" width="150" height="100" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" />
            <circle cx="262" cy="80" r="22" fill={color} />
            <circle cx="255" cy="74" r="3" fill="#fff" />
            <circle cx="269" cy="74" r="3" fill="#fff" />
            <path d="M254 86 q8 7 16 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <polygon points="318,62 318,98 346,80" fill="#fff" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={222 + i * 30} y="136" width="22" height="10" rx="2" fill="rgba(255,255,255,0.25)" />
            ))}
          </g>
        )}
      </svg>
      <span className="absolute bottom-4 left-5 text-xs font-semibold tracking-[0.2em] text-white/80 uppercase">
        {sales ? "AI for sales" : "AI animation"}
      </span>
    </div>
  );
}
