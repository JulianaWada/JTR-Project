import type { ServiceId } from "@/content/site";

const accents: Record<ServiceId, string> = {
  websites: "#3b9bff",
  mobile: "#6bb4ff",
  "agentic-ai": "#1e7bf2",
  edtech: "#8fc4ff",
  "digital-transformation": "#c5ccd6",
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic abstract artwork used as a placeholder until real project images exist. */
export function ProjectArt({ seed, service }: { seed: string; service: ServiceId }) {
  const h = hash(seed);
  const accent = accents[service];
  const bars = Array.from({ length: 7 }, (_, i) => 30 + ((h >> i) % 7) * 12);
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="absolute inset-0 h-full w-full">
      <rect width="320" height="200" fill="#0a1a33" />
      <g stroke="#ffffff" strokeOpacity="0.06">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${i * 32 - 60} 200 L${i * 32 + 60} 0`} />
        ))}
      </g>
      <circle cx={220 + (h % 40)} cy={70 + (h % 30)} r="70" fill={accent} opacity="0.16" />
      <circle cx={220 + (h % 40)} cy={70 + (h % 30)} r="44" fill="none" stroke={accent} strokeOpacity="0.6" />
      <g transform="translate(36 150)">
        {bars.map((b, i) => (
          <rect key={i} x={i * 18} y={-b} width="10" height={b} rx="2" fill={i === h % 7 ? accent : "#c5ccd6"} opacity={i === h % 7 ? 1 : 0.35} />
        ))}
      </g>
      <path d="M250 150h40l24 36h-40Z" fill={accent} opacity="0.85" />
    </svg>
  );
}
