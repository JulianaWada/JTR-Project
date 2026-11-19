"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

/*
 * Cartoon building blocks for the animated lessons. Everything is drawn in SVG on a 960 x 540 stage,
 * so a scene stays sharp on a phone and in full screen. Characters are shaded with soft gradients,
 * highlights and floor shadows to give the rounded "3D cartoon" look, and they blink, breathe,
 * talk and gesture with the CSS animations in globals.css (classes starting with "ac-").
 */

export type Skin = { light: string; base: string; dark: string };

export const SKIN = {
  deep: { light: "#8f5a37", base: "#683d22", dark: "#432513" },
  brown: { light: "#b8835a", base: "#8a5733", dark: "#5c361c" },
  warm: { light: "#d09a6c", base: "#a56b40", dark: "#6e4224" },
} satisfies Record<string, Skin>;

export type Pose = "idle" | "wave" | "point" | "cheer" | "present" | "hold";
export type Mood = "happy" | "thinking" | "excited";
export type Hair = "gele" | "puff" | "short" | "bun" | "braids";

type CharacterProps = {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  skin?: Skin;
  hair?: Hair;
  hairColor?: string;
  outfit: string;
  outfitDark?: string;
  /** Dots of a second colour on the outfit, for an ankara print. */
  print?: string;
  trousers?: string;
  /** "dress" for a dress or kaftan, "shirt" for a top with trousers. */
  body?: "dress" | "shirt";
  pose?: Pose;
  mood?: Mood;
  talking?: boolean;
  /** Greys the character out, for "the crowd" that isn't listening. */
  faded?: boolean;
  /** Something held in the right hand (drawn at the hand). */
  holding?: ReactNode;
  /** A short, neat beard. */
  beard?: boolean;
};

const ARM_ANGLES: Record<Pose, [number, number]> = {
  idle: [10, -10],
  wave: [10, -150],
  point: [10, -98],
  cheer: [150, -150],
  present: [55, -55],
  hold: [10, -55],
};

export function Character({
  x,
  y,
  scale = 1,
  flip = false,
  skin = SKIN.brown,
  hair = "short",
  hairColor = "#1b120d",
  outfit,
  outfitDark,
  print,
  trousers = "#1f2d44",
  body = "dress",
  pose = "idle",
  mood = "happy",
  talking = false,
  faded = false,
  holding,
  beard = false,
}: CharacterProps) {
  const id = useId().replace(/:/g, "");
  const shade = outfitDark ?? darken(outfit);
  const [leftAngle, rightAngle] = ARM_ANGLES[pose];
  const dress = body === "dress";

  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}
      className="ac-character"
      style={{ filter: faded ? "grayscale(1) opacity(0.45)" : undefined, transition: "filter .8s" }}
    >
      <defs>
        <radialGradient id={`skin-${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor={skin.light} />
          <stop offset="0.6" stopColor={skin.base} />
          <stop offset="1" stopColor={skin.dark} />
        </radialGradient>
        <linearGradient id={`limb-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={skin.light} />
          <stop offset="1" stopColor={skin.dark} />
        </linearGradient>
        <radialGradient id={`cloth-${id}`} cx="30%" cy="20%" r="90%">
          <stop offset="0" stopColor={lighten(outfit)} />
          <stop offset="0.55" stopColor={outfit} />
          <stop offset="1" stopColor={shade} />
        </radialGradient>
        <radialGradient id={`hair-${id}`} cx="35%" cy="25%" r="80%">
          <stop offset="0" stopColor={hair === "gele" ? lighten(hairColor) : "#4a3a30"} />
          <stop offset="0.5" stopColor={hairColor} />
          <stop offset="1" stopColor={hair === "gele" ? darken(hairColor) : "#000"} />
        </radialGradient>
        {print && (
          <pattern id={`print-${id}`} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="4" fill={print} opacity="0.85" />
            <circle cx="17" cy="17" r="2.5" fill={print} opacity="0.6" />
            <path d="M14 4 l4 4 -4 4 -4 -4z" fill="#fff" opacity="0.25" />
          </pattern>
        )}
      </defs>

      {/* floor shadow */}
      <ellipse cx="0" cy="2" rx="62" ry="11" fill="#0a1a33" opacity="0.2" />

      <g className="ac-breathe">
        {/* legs and shoes */}
        {dress ? (
          <>
            <rect x="-26" y="-104" width="20" height="100" rx="10" fill={`url(#limb-${id})`} />
            <rect x="6" y="-104" width="20" height="100" rx="10" fill={`url(#limb-${id})`} />
          </>
        ) : (
          <>
            <rect x="-30" y="-120" width="26" height="116" rx="12" fill={trousers} />
            <rect x="4" y="-120" width="26" height="116" rx="12" fill={darken(trousers)} />
          </>
        )}
        <ellipse cx="-19" cy="-4" rx="20" ry="9" fill="#1d1d26" />
        <ellipse cx="19" cy="-4" rx="20" ry="9" fill="#1d1d26" />
        <ellipse cx="-24" cy="-8" rx="7" ry="3" fill="#fff" opacity="0.25" />

        {/* back arm */}
        <Arm x={-44} angle={leftAngle} skinFill={`url(#limb-${id})`} sleeve={`url(#cloth-${id})`} />

        {/* torso */}
        {dress ? (
          <path d="M-46 -214 Q-58 -150 -70 -92 Q0 -80 70 -92 Q58 -150 46 -214 Q0 -232 -46 -214Z" fill={`url(#cloth-${id})`} />
        ) : (
          <path d="M-46 -214 Q-52 -160 -48 -112 Q0 -104 48 -112 Q52 -160 46 -214 Q0 -232 -46 -214Z" fill={`url(#cloth-${id})`} />
        )}
        {print &&
          (dress ? (
            <path d="M-46 -214 Q-58 -150 -70 -92 Q0 -80 70 -92 Q58 -150 46 -214 Q0 -232 -46 -214Z" fill={`url(#print-${id})`} />
          ) : (
            <path d="M-46 -214 Q-52 -160 -48 -112 Q0 -104 48 -112 Q52 -160 46 -214 Q0 -232 -46 -214Z" fill={`url(#print-${id})`} />
          ))}
        {/* collar shine */}
        <path d="M-30 -220 Q0 -205 30 -220" stroke="#fff" strokeOpacity="0.25" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* neck */}
        <rect x="-12" y="-240" width="24" height="26" rx="8" fill={skin.dark} />

        {/* head */}
        <HairBack hair={hair} fill={`url(#hair-${id})`} />
        <circle cx="-57" cy="-290" r="10" fill={skin.base} />
        <circle cx="57" cy="-290" r="10" fill={skin.base} />
        <circle cx="0" cy="-292" r="58" fill={`url(#skin-${id})`} />
        <ellipse cx="-20" cy="-322" rx="18" ry="10" fill="#fff" opacity="0.12" />
        <HairFront hair={hair} fill={`url(#hair-${id})`} stroke={hair === "gele" ? darken(hairColor) : "#000"} />
        {(hair === "gele" || hair === "puff" || hair === "bun" || hair === "braids") && (
          <>
            <circle cx="-57" cy="-276" r="5" fill="#f2c14e" />
            <circle cx="57" cy="-276" r="5" fill="#f2c14e" />
          </>
        )}

        {beard && <path d="M-48 -292 Q-46 -236 0 -232 Q46 -236 48 -292 Q40 -258 0 -252 Q-40 -258 -48 -292Z" fill={hairColor} opacity="0.9" />}
        <Face mood={mood} talking={talking} lashes={hair !== "short"} />

        {/* front arm */}
        <Arm x={44} angle={rightAngle} skinFill={`url(#limb-${id})`} sleeve={`url(#cloth-${id})`} wave={pose === "wave"} holding={holding} />
      </g>
    </g>
  );
}

function Arm({
  x,
  angle,
  skinFill,
  sleeve,
  wave,
  holding,
}: {
  x: number;
  angle: number;
  skinFill: string;
  sleeve: string;
  wave?: boolean;
  holding?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} -204)`}>
      <g className={wave ? "ac-wave" : undefined} style={wave ? undefined : { transform: `rotate(${angle}deg)`, transition: "transform .6s cubic-bezier(.3,1.4,.5,1)" }}>
        <rect x="-11" y="-6" width="22" height="88" rx="11" fill={skinFill} />
        <rect x="-13" y="-8" width="26" height="40" rx="13" fill={sleeve} />
        <circle cx="0" cy="88" r="13" fill={skinFill} />
        {holding && <g transform="translate(0 92)">{holding}</g>}
      </g>
    </g>
  );
}

function HairBack({ hair, fill }: { hair: Hair; fill: string }) {
  if (hair === "puff") return <circle cx="0" cy="-308" r="74" fill={fill} />;
  if (hair === "bun")
    return (
      <>
        <ellipse cx="0" cy="-300" rx="64" ry="66" fill={fill} />
        <circle cx="0" cy="-372" r="24" fill={fill} />
      </>
    );
  if (hair === "braids")
    return (
      <>
        <ellipse cx="0" cy="-300" rx="66" ry="66" fill={fill} />
        {[-58, -44, 44, 58].map((bx) => (
          <rect key={bx} x={bx - 7} y="-300" width="14" height="96" rx="7" fill={fill} />
        ))}
      </>
    );
  return null;
}

function HairFront({ hair, fill, stroke }: { hair: Hair; fill: string; stroke: string }) {
  if (hair === "gele")
    return (
      <g>
        <path d="M-70 -312 Q-104 -392 -30 -398 Q2 -430 46 -398 Q108 -392 72 -312 Q0 -346 -70 -312Z" fill={fill} />
        <path d="M-62 -300 Q0 -346 62 -300 L60 -324 Q0 -360 -60 -324Z" fill={fill} />
        <g stroke={stroke} strokeOpacity="0.55" strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M-56 -330 Q-70 -370 -36 -388" />
          <path d="M-26 -342 Q-20 -380 6 -404" />
          <path d="M12 -344 Q28 -378 50 -392" />
          <path d="M40 -334 Q66 -350 70 -320" />
        </g>
        <path d="M-40 -390 Q-10 -410 20 -400" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    );
  if (hair === "short") return <path d="M-58 -298 Q-62 -356 0 -354 Q62 -356 58 -298 Q44 -334 0 -334 Q-44 -334 -58 -298Z" fill={fill} />;
  if (hair === "puff" || hair === "bun" || hair === "braids")
    return <path d="M-58 -296 Q-56 -352 0 -352 Q56 -352 58 -296 Q36 -330 0 -330 Q-36 -330 -58 -296Z" fill={fill} />;
  return null;
}

/**
 * Faces are always friendly (Jules: no sad or angry faces). "thinking" looks up with a soft smile,
 * "excited" has raised brows and a big open smile.
 */
function Face({ mood, talking, lashes }: { mood: Mood; talking: boolean; lashes: boolean }) {
  // Soft arches, the inner ends a little higher than the outer ends, so the look is warm, never cross.
  const lift = mood === "excited" ? -6 : mood === "thinking" ? -3 : 0;
  const brow = [`M-34 ${-315 + lift} Q-22 ${-327 + lift} -10 ${-320 + lift}`, `M10 ${-320 + lift} Q22 ${-327 + lift} 34 ${-315 + lift}`];
  const look = mood === "thinking" ? -4 : 0;
  return (
    <g>
      {brow.map((d) => (
        <path key={d} d={d} stroke="#1b120d" strokeWidth="4" fill="none" strokeLinecap="round" />
      ))}
      <g className="ac-blink">
        {[-21, 21].map((ex) => (
          <g key={ex}>
            <ellipse cx={ex} cy="-293" rx="12" ry={mood === "excited" ? 15 : 14} fill="#fff" />
            <circle cx={ex + 1} cy={-290 + look} r="8.5" fill="#2a1a10" />
            <circle cx={ex + 1} cy={-290 + look} r="4" fill="#000" />
            <circle cx={ex + 4} cy={-294 + look} r="3" fill="#fff" />
            {lashes && <path d={`M${ex - 12} -300 l-5 -4 M${ex + 12} -300 l5 -4`} stroke="#1b120d" strokeWidth="2.5" strokeLinecap="round" />}
          </g>
        ))}
      </g>
      <ellipse cx="-36" cy="-270" rx="9" ry="5" fill="#ff6b5b" opacity="0.3" />
      <ellipse cx="36" cy="-270" rx="9" ry="5" fill="#ff6b5b" opacity="0.3" />
      <path d="M-6 -274 Q0 -268 6 -274" stroke="#3a2015" strokeWidth="3" fill="none" strokeLinecap="round" />
      {talking ? (
        <g className="ac-talk">
          <path d="M-13 -260 Q0 -238 13 -260Z" fill="#4a1612" />
          <ellipse cx="0" cy="-249" rx="6" ry="3" fill="#d9615a" />
        </g>
      ) : mood === "thinking" ? (
        <path d="M-12 -258 Q0 -248 12 -258" stroke="#3a1a10" strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <path d={mood === "excited" ? "M-19 -263 Q0 -232 19 -263Z" : "M-17 -262 Q0 -238 17 -262Z"} fill="#4a1612" />
          <path d="M-13 -261 Q0 -256 13 -261 L12 -258 Q0 -253 -12 -258Z" fill="#fff" />
        </>
      )}
    </g>
  );
}

/* ---------- colour helpers ---------- */

function shiftColour(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = (shift: number) => Math.max(0, Math.min(255, ((n >> shift) & 255) + amount));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}
export const lighten = (hex: string) => shiftColour(hex, 40);
export const darken = (hex: string) => shiftColour(hex, -45);

/* ---------- the lesson's recurring cast ---------- */

type CastProps = Omit<CharacterProps, "outfit" | "skin" | "hair">;

/** Amaka runs a ready-to-wear boutique in Yaba, Lagos. She is the business owner in every scene. */
export const Amaka = (p: CastProps) => <Character skin={SKIN.brown} hair="gele" hairColor="#e0a21a" outfit="#d9482b" print="#f6c445" {...p} />;
/** Tolu, a young banker in Lekki: Amaka's ideal customer. */
export const Tolu = (p: CastProps) => <Character skin={SKIN.warm} hair="puff" hairColor="#20140e" outfit="#2f6fde" body="dress" {...p} />;
/** Kemi, a make-up artist, Amaka's partner business. */
export const Kemi = (p: CastProps) => <Character skin={SKIN.deep} hair="braids" hairColor="#1b120d" outfit="#8a3fd1" print="#f2a7ff" {...p} />;
/** Chidi looks after Amaka's WhatsApp and Instagram orders. */
export const Chidi = (p: CastProps) => <Character skin={SKIN.deep} hair="short" outfit="#1d4e89" print="#7fb3ff" body="shirt" trousers="#2b2f38" beard {...p} />;
/** Emeka, a delivery rider. */
export const Emeka = (p: CastProps) => <Character skin={SKIN.deep} hair="short" outfit="#1f9d6b" body="shirt" trousers="#26364f" {...p} />;

/* ---------- scene pieces ---------- */

/** Shows its children when `show` is true: fading in and rising, sliding or popping into place. */
export function Appear({ show, from = "up", delay = 0, children }: { show: boolean; from?: "up" | "left" | "right" | "pop" | "down"; delay?: number; children: ReactNode }) {
  const hidden = { up: "translateY(26px)", down: "translateY(-26px)", left: "translateX(-60px)", right: "translateX(60px)", pop: "scale(0.4)" }[from];
  return (
    <g
      className="ac-appear"
      style={{ opacity: show ? 1 : 0, transform: show ? "none" : hidden, transitionDelay: show ? `${delay}ms` : "0ms" }}
    >
      {children}
    </g>
  );
}

/** Text that types itself out once `show` turns on. */
export function Typed({ text, show, speed = 28, delay = 0, ...rest }: { text: string; show: boolean; speed?: number; delay?: number } & React.SVGProps<SVGTextElement>) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!show) return;
    let i = 0;
    let t: ReturnType<typeof setInterval> | undefined;
    const wait = setTimeout(() => {
      setCount(0);
      t = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) clearInterval(t);
      }, speed);
    }, delay);
    return () => {
      clearTimeout(wait);
      clearInterval(t);
    };
  }, [show, text, speed, delay]);
  const shown = show ? count : 0;
  return (
    <text {...rest}>
      {text.slice(0, shown)}
      {shown > 0 && shown < text.length && <tspan opacity="0.6">|</tspan>}
    </text>
  );
}

/** A speech or thought bubble with up to three lines, its tail pointing down-left or down-right. */
export function Bubble({
  x,
  y,
  lines,
  width = 220,
  tail = "left",
  tone = "white",
  thought = false,
  size = 18,
}: {
  x: number;
  y: number;
  lines: string[];
  width?: number;
  tail?: "left" | "right" | "none";
  tone?: "white" | "green" | "blue" | "red";
  thought?: boolean;
  size?: number;
}) {
  const h = lines.length * (size + 8) + 22;
  const fill = { white: "#ffffff", green: "#dcf8c6", blue: "#dbe8ff", red: "#ffe1dc" }[tone];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="2" y="5" width={width} height={h} rx="18" fill="#0a1a33" opacity="0.12" />
      <rect width={width} height={h} rx="18" fill={fill} stroke="#0a1a33" strokeOpacity="0.08" />
      {tail !== "none" &&
        (thought ? (
          <>
            <circle cx={tail === "left" ? 30 : width - 30} cy={h + 12} r="8" fill={fill} />
            <circle cx={tail === "left" ? 20 : width - 20} cy={h + 28} r="5" fill={fill} />
          </>
        ) : (
          <path d={tail === "left" ? `M26 ${h - 2} l-8 22 l26 -22z` : `M${width - 26} ${h - 2} l8 22 l-26 -22z`} fill={fill} />
        ))}
      {lines.map((l, i) => (
        <text key={i} x="16" y={18 + (i + 1) * (size + 8) - 8} fontSize={size} fontWeight={600} fill="#0a1a33">
          {l}
        </text>
      ))}
    </g>
  );
}

/** A rounded label with an emoji, used for facts that pop up around a character. */
export function Chip({ x, y, icon, text, tone = "#1563d6", width }: { x: number; y: number; icon: string; text: string; tone?: string; width?: number }) {
  const w = width ?? 54 + text.length * 10.5;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="2" y="4" width={w} height="44" rx="22" fill="#0a1a33" opacity="0.14" />
      <rect width={w} height="44" rx="22" fill="#fff" />
      <circle cx="22" cy="22" r="17" fill={tone} opacity="0.15" />
      <text x="22" y="29" fontSize="20" textAnchor="middle">
        {icon}
      </text>
      <text x="46" y="29" fontSize="18" fontWeight={600} fill="#0a1a33">
        {text}
      </text>
    </g>
  );
}

/** A smartphone; children are drawn on its screen (screen is 150 x 290, origin at the screen's top left). */
export function Phone({ x, y, scale = 1, children, title = "Chats", header = "#0b7a5b" }: { x: number; y: number; scale?: number; children?: ReactNode; title?: string; header?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <clipPath id={`screen-${id}`}>
          <rect x="10" y="22" width="150" height="290" rx="10" />
        </clipPath>
        <linearGradient id={`frame-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#3a4658" />
          <stop offset="1" stopColor="#151c27" />
        </linearGradient>
      </defs>
      <rect x="6" y="10" width="170" height="330" rx="26" fill="#0a1a33" opacity="0.18" />
      <rect width="170" height="334" rx="26" fill={`url(#frame-${id})`} />
      <rect x="10" y="22" width="150" height="290" rx="10" fill="#efe7dc" />
      <g clipPath={`url(#screen-${id})`}>
        <rect x="10" y="22" width="150" height="34" fill={header} />
        <circle cx="28" cy="39" r="9" fill="#fff" opacity="0.85" />
        <text x="44" y="44" fontSize="13" fontWeight={700} fill="#fff">
          {title}
        </text>
        <g transform="translate(10 56)">{children}</g>
      </g>
      <rect x="62" y="10" width="46" height="6" rx="3" fill="#000" opacity="0.5" />
      <rect x="10" y="22" width="40" height="290" rx="10" fill="#fff" opacity="0.06" />
    </g>
  );
}

/** A laptop showing an AI chat. Children are drawn inside the chat area (340 x 190). */
export function Laptop({ x, y, scale = 1, children }: { x: number; y: number; scale?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="200" cy="292" rx="230" ry="14" fill="#0a1a33" opacity="0.18" />
      <rect width="400" height="262" rx="16" fill="#1e2735" />
      <rect x="14" y="14" width="372" height="234" rx="6" fill="#f7f9fc" />
      <rect x="14" y="14" width="372" height="30" rx="6" fill="#e9eef6" />
      <circle cx="30" cy="29" r="5" fill="#ff6159" />
      <circle cx="46" cy="29" r="5" fill="#ffbd2e" />
      <circle cx="62" cy="29" r="5" fill="#28c840" />
      <text x="200" y="34" fontSize="13" fontWeight={700} fill="#44546a" textAnchor="middle">
        ✨ AI assistant
      </text>
      <g transform="translate(30 52)">{children}</g>
      <path d="M-20 262 L420 262 L400 286 L0 286Z" fill="#c7d0dc" />
      <rect x="160" y="264" width="80" height="6" rx="3" fill="#9aa8ba" />
    </g>
  );
}

/** Scene background: inside Amaka's boutique, with a clothes rail, a window onto a Lagos street and a counter. */
export function Boutique({ dim = false }: { dim?: boolean }) {
  return (
    <g>
      <defs>
        <linearGradient id="bq-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbe7cf" />
          <stop offset="1" stopColor="#f3d2ad" />
        </linearGradient>
        <linearGradient id="bq-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c98b5a" />
          <stop offset="1" stopColor="#a8693d" />
        </linearGradient>
        <linearGradient id="bq-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cc4ff" />
          <stop offset="1" stopColor="#d7f0ff" />
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill="url(#bq-wall)" />
      <rect y="430" width="960" height="110" fill="url(#bq-floor)" />
      <rect y="428" width="960" height="6" fill="#8a5330" opacity="0.5" />
      {/* window onto a Lagos street */}
      <g transform="translate(600 96)">
        <rect width="300" height="200" rx="14" fill="#8a5330" />
        <rect x="12" y="12" width="276" height="176" rx="8" fill="url(#bq-sky)" />
        <circle cx="240" cy="50" r="22" fill="#ffd45c" />
        {[
          [20, 90, 40, 98],
          [64, 60, 46, 128],
          [114, 100, 34, 88],
          [152, 40, 50, 148],
          [206, 84, 40, 104],
          [250, 110, 36, 78],
        ].map(([bx, by, bw, bh]) => (
          <g key={bx}>
            <rect x={bx} y={by} width={bw} height={bh} fill="#5b7aa6" />
            {Array.from({ length: Math.floor(bh / 22) }, (_, r) => (
              <rect key={r} x={bx + 8} y={by + 10 + r * 22} width={bw - 16} height="8" fill="#ffe8a3" opacity="0.7" />
            ))}
          </g>
        ))}
        {/* yellow Lagos bus */}
        <g transform="translate(40 150)">
          <rect width="110" height="34" rx="8" fill="#f7c21a" />
          <rect x="6" y="2" width="98" height="6" fill="#111" opacity="0.8" />
          <rect x="10" y="10" width="20" height="12" rx="2" fill="#bfe3ff" />
          <rect x="36" y="10" width="20" height="12" rx="2" fill="#bfe3ff" />
          <rect x="62" y="10" width="20" height="12" rx="2" fill="#bfe3ff" />
          <circle cx="24" cy="34" r="8" fill="#222" />
          <circle cx="88" cy="34" r="8" fill="#222" />
        </g>
        <rect x="146" y="12" width="8" height="176" fill="#8a5330" />
      </g>
      {/* shop sign */}
      <g transform="translate(300 22)">
        <rect width="260" height="56" rx="14" fill="#0a1a33" />
        <text x="130" y="38" fontSize="26" fontWeight={700} fill="#ffd45c" textAnchor="middle" fontFamily="var(--font-heading)">
          Amaka&apos;s Styles
        </text>
      </g>
      {/* clothes rail */}
      <g transform="translate(60 150)">
        <rect x="0" y="0" width="300" height="8" rx="4" fill="#6b7a8f" />
        <rect x="6" y="0" width="8" height="280" fill="#6b7a8f" />
        <rect x="286" y="0" width="8" height="280" fill="#6b7a8f" />
        {["#e4572e", "#2f6fde", "#1f9d6b", "#f2b134", "#8a3fd1", "#e2447a"].map((c, i) => (
          <g key={c} transform={`translate(${30 + i * 44} 4)`}>
            <path d="M0 0 q0 -10 8 -10" stroke="#555" strokeWidth="2" fill="none" />
            <path d={`M-16 10 L16 10 L24 ${120 + (i % 2) * 20} L-24 ${120 + (i % 2) * 20}Z`} fill={c} />
            <path d={`M-16 10 L16 10 L24 ${120 + (i % 2) * 20} L-24 ${120 + (i % 2) * 20}Z`} fill="#fff" opacity="0.12" />
            <circle cx="-6" cy="40" r="3" fill="#fff" opacity="0.5" />
            <circle cx="6" cy="70" r="3" fill="#fff" opacity="0.5" />
          </g>
        ))}
      </g>
      {/* plant */}
      <g transform="translate(905 430)">
        <rect x="-18" y="-40" width="36" height="40" rx="6" fill="#c4682d" />
        {[-40, -15, 15, 40].map((a) => (
          <ellipse key={a} cx="0" cy="-80" rx="12" ry="42" fill="#2e8b57" transform={`rotate(${a} 0 -40)`} />
        ))}
      </g>
      {dim && <rect width="960" height="540" fill="#fff" opacity="0.4" />}
    </g>
  );
}

/** A plain, softly lit studio backdrop for scenes that don't happen in the shop. */
export function Studio({ tone = "#dbe8ff" }: { tone?: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`studio-${tone.slice(1)}`} cx="50%" cy="40%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor={tone} />
        </radialGradient>
      </defs>
      <rect width="960" height="540" fill={`url(#studio-${tone.slice(1)})`} />
      <ellipse cx="480" cy="470" rx="520" ry="80" fill="#0a1a33" opacity="0.06" />
      <circle cx="120" cy="90" r="60" fill="#fff" opacity="0.5" />
      <circle cx="860" cy="120" r="90" fill="#fff" opacity="0.35" />
    </g>
  );
}

/** A heading pill in the top left corner of a scene. */
export function SceneTitle({ text }: { text: string }) {
  return (
    <g transform="translate(24 22)">
      <rect x="2" y="4" width={36 + text.length * 12.2} height="46" rx="23" fill="#0a1a33" opacity="0.18" />
      <rect width={36 + text.length * 12.2} height="46" rx="23" fill="#0a1a33" />
      <text x="20" y="31" fontSize="21" fontWeight={700} fill="#fff" fontFamily="var(--font-heading)">
        {text}
      </text>
    </g>
  );
}

/** The JTR Academy badge in the top right corner of every scene (emblem without "LTD"). */
export function BrandBadge() {
  return (
    <g transform="translate(776 14)" aria-label="JTR Academy">
      <rect x="2" y="4" width="170" height="52" rx="26" fill="#0a1a33" opacity="0.18" />
      <rect width="170" height="52" rx="26" fill="#0a1a33" />
      {/* Served from /public under the app's /academy base path. */}
      <image href="/academy/brand/jtr-emblem.png" x="6" y="4" width="44" height="44" />
      <text x="58" y="25" fontSize="18" fontWeight={800} fill="#ffffff" letterSpacing="2" fontFamily="var(--font-heading)">
        JTR
      </text>
      <text x="58" y="42" fontSize="11" fontWeight={600} fill="#b4bfcd" letterSpacing="2.5">
        ACADEMY
      </text>
    </g>
  );
}

/** A big green tick that pops in. */
export function Tick({ x, y, r = 18 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#16a34a" />
      <path d={`M${-r * 0.45} 0 l${r * 0.3} ${r * 0.32} l${r * 0.6} ${-r * 0.62}`} stroke="#fff" strokeWidth={r * 0.22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}
