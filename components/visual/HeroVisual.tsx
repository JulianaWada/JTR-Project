/**
 * Abstract hero illustration: silver and electric-blue rings (from the emblem) around a
 * network of connected nodes spanning the globe. Pure SVG, no JavaScript.
 */
export function HeroVisual({ className }: { className?: string }) {
  const nodes = [
    [200, 92], [292, 140], [318, 236], [262, 316], [160, 322], [92, 250], [96, 150], [200, 210],
  ];
  const links = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [7, 0], [7, 2], [7, 4], [7, 5], [1, 7], [3, 7],
  ];
  return (
    <svg viewBox="0 0 400 400" role="presentation" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="hv-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2f4f7" />
          <stop offset="45%" stopColor="#9aa4b2" />
          <stop offset="70%" stopColor="#e6e9ee" />
          <stop offset="100%" stopColor="#7d8796" />
        </linearGradient>
        <linearGradient id="hv-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6bb4ff" />
          <stop offset="100%" stopColor="#1563d6" />
        </linearGradient>
        <radialGradient id="hv-core" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#1b3a63" />
          <stop offset="100%" stopColor="#07111f" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="190" fill="none" stroke="url(#hv-silver)" strokeWidth="10" />
      <circle cx="200" cy="200" r="176" fill="url(#hv-core)" />
      <circle cx="200" cy="200" r="168" fill="none" stroke="url(#hv-blue)" strokeWidth="2.5" />
      {/* meridians */}
      <g fill="none" stroke="#3b9bff" strokeOpacity="0.18" strokeWidth="1">
        <ellipse cx="200" cy="200" rx="150" ry="150" />
        <ellipse cx="200" cy="200" rx="90" ry="150" />
        <ellipse cx="200" cy="200" rx="35" ry="150" />
        <ellipse cx="200" cy="200" rx="150" ry="55" />
        <path d="M50 200h300" />
      </g>
      <g stroke="#c5ccd6" strokeOpacity="0.55" strokeWidth="1.2">
        {links.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
        ))}
      </g>
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === 7 ? 9 : 5} fill={i === 7 ? "url(#hv-blue)" : "#e6ebf2"} />
          {i === 7 && <circle cx={x} cy={y} r="18" fill="none" stroke="#3b9bff" strokeOpacity="0.4" />}
        </g>
      ))}
      {/* diagonal slash echoing the R in the emblem */}
      <path d="M262 300 318 300 352 352 296 352Z" fill="url(#hv-blue)" opacity="0.9" />
    </svg>
  );
}
