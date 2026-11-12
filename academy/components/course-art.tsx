import { cn } from "@/lib/cn";

const NAVY = "#0a1a33";
const SILVER = "#c5ccd6";

/**
 * Branded cover picture for a course: a clean white design with navy line work and the course's accent colour.
 * Drawn in SVG so it needs no image files, and it stays white in dark mode too (it is a picture, like a photo).
 */
export function CourseArt({ slug, accent, className }: { slug: string; accent: "blue" | "violet"; className?: string }) {
  const color = accent === "violet" ? "#6d4aff" : "#1563d6";
  const soft = accent === "violet" ? "#ece8ff" : "#e4eefb";
  const sales = slug.includes("sales");
  return (
    <div
      className={cn("relative overflow-hidden border-b border-[#e6eaf0]", className ?? "h-40")}
      style={{
        background: `radial-gradient(60% 90% at 85% 45%, ${soft}, transparent 70%), radial-gradient(${SILVER} 1px, transparent 1.3px) 0 0 / 14px 14px, linear-gradient(180deg, #f1f5f9 0%, #e7edf4 100%)`,
      }}
      aria-hidden
    >
      <svg viewBox="132 10 258 142" className="absolute top-0 right-3 h-full w-auto max-w-[85%]" preserveAspectRatio="xMaxYMid meet">

        {sales ? (
          <g>
            {/* chart card */}
            <rect x="196" y="22" width="168" height="116" rx="14" fill="#fff" stroke="#e1e6ee" />
            <rect x="196" y="22" width="168" height="116" rx="14" fill="none" stroke={color} strokeOpacity="0.12" strokeWidth="4" />
            <rect x="212" y="34" width="44" height="6" rx="3" fill={NAVY} opacity="0.8" />
            <rect x="212" y="45" width="28" height="5" rx="2.5" fill={SILVER} />
            {[22, 34, 28, 48, 58, 72].map((h, i) => (
              <rect key={i} x={214 + i * 23} y={126 - h} width="13" height={h} rx="3" fill={color} opacity={0.25 + i * 0.13} />
            ))}
            <polyline points="220,98 243,86 266,92 289,70 312,60 335,40" fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="335" cy="40" r="5" fill="#fff" stroke={NAVY} strokeWidth="2.5" />
            {/* "new order" chat bubble */}
            <g transform="translate(140 34)">
              <rect width="76" height="30" rx="10" fill={NAVY} />
              <path d="M58 30 l8 9 l2 -9 z" fill={NAVY} />
              <circle cx="15" cy="15" r="7" fill={color} />
              <path d="M12 15 l2.5 2.5 l4.5 -5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="28" y="10" width="38" height="4" rx="2" fill="#fff" />
              <rect x="28" y="17" width="26" height="4" rx="2" fill="#fff" opacity="0.5" />
            </g>
            {/* coin */}
            <g transform="translate(364 118)">
              <circle r="15" fill={soft} stroke={color} strokeWidth="2" />
              <text y="5" textAnchor="middle" fontSize="15" fontWeight="700" fill={color} fontFamily="system-ui, sans-serif">+</text>
            </g>
          </g>
        ) : (
          <g>
            {/* video frame */}
            <rect x="196" y="20" width="168" height="104" rx="14" fill="#fff" stroke="#e1e6ee" />
            <rect x="208" y="32" width="144" height="80" rx="9" fill={soft} />
            <circle cx="250" cy="72" r="22" fill={color} />
            <circle cx="243" cy="66" r="3" fill="#fff" />
            <circle cx="257" cy="66" r="3" fill="#fff" />
            <path d="M242 78 q8 7 16 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="314" cy="72" r="18" fill={NAVY} />
            <polygon points="309,62 309,82 325,72" fill="#fff" />
            {/* timeline */}
            <rect x="208" y="132" width="144" height="5" rx="2.5" fill="#e1e6ee" />
            <rect x="208" y="132" width="62" height="5" rx="2.5" fill={color} />
            <circle cx="270" cy="134.5" r="5" fill="#fff" stroke={color} strokeWidth="2" />
            {/* film strip */}
            <g transform="translate(146 40) rotate(-10)">
              <rect width="44" height="64" rx="6" fill={NAVY} />
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <rect x="4" y={6 + i * 11.5} width="5" height="6" rx="1" fill="#fff" opacity="0.7" />
                  <rect x="35" y={6 + i * 11.5} width="5" height="6" rx="1" fill="#fff" opacity="0.7" />
                </g>
              ))}
              <rect x="12" y="8" width="20" height="22" rx="3" fill={color} opacity="0.9" />
              <rect x="12" y="34" width="20" height="22" rx="3" fill="#fff" opacity="0.85" />
            </g>
            {/* sparkle */}
            <path d="M372 26 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" fill={color} />
          </g>
        )}
      </svg>
      <span
        className="absolute bottom-4 left-5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase"
        style={{ color: NAVY, background: "rgba(255,255,255,0.85)", boxShadow: `inset 0 0 0 1px ${SILVER}` }}
      >
        {sales ? "AI for sales" : "AI animation"}
      </span>
    </div>
  );
}
