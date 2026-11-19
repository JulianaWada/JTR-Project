"use client";

import type { ReactNode } from "react";
import { Appear, Tick } from "../cartoon";

/* Pieces the "How to Build AI Agents Without Code" lessons share. */

/** A friendly assistant robot (always smiling). */
export function Robot({ x, y, scale = 1, tone = "#1563d6", wave = false }: { x: number; y: number; scale?: number; tone?: string; wave?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="118" rx="62" ry="10" fill="#0a1a33" opacity="0.14" />
      <line x1="0" y1="-78" x2="0" y2="-98" stroke="#0a1a33" strokeWidth="5" strokeLinecap="round" />
      <circle cx="0" cy="-104" r="9" fill="#ffd45c" className="ac-pulse" />
      <rect x="-58" y="-80" width="116" height="92" rx="30" fill="#0a1a33" />
      <rect x="-46" y="-68" width="92" height="66" rx="22" fill="#eaf2ff" />
      <circle cx="-20" cy="-40" r="9" fill="#0a1a33" />
      <circle cx="20" cy="-40" r="9" fill="#0a1a33" />
      <circle cx="-17" cy="-43" r="3" fill="#fff" />
      <circle cx="23" cy="-43" r="3" fill="#fff" />
      <path d="M-18 -20 q18 14 36 0" stroke="#0a1a33" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="-34" cy="-24" r="6" fill="#ff9db0" opacity="0.6" />
      <circle cx="34" cy="-24" r="6" fill="#ff9db0" opacity="0.6" />
      <rect x="-44" y="18" width="88" height="84" rx="24" fill={tone} />
      <rect x="-24" y="38" width="48" height="30" rx="10" fill="#fff" opacity="0.9" />
      <text x="0" y="60" fontSize="18" fontWeight={800} textAnchor="middle" fill={tone}>
        AI
      </text>
      <rect x="-70" y="28" width="22" height="56" rx="11" fill={tone} />
      <g transform={wave ? "rotate(-140 59 34)" : undefined}>
        <rect x="48" y="28" width="22" height="56" rx="11" fill={tone} />
      </g>
    </g>
  );
}

/** A browser window for a web tool (e.g. Botpress, ManyChat, Paystack). Children are drawn in the page area (w x h-40). */
export function AppWindow({ x, y, w, h, title, tone = "#1563d6", children }: { x: number; y: number; w: number; h: number; title: string; tone?: string; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="6" y="10" width={w} height={h} rx="16" fill="#0a1a33" opacity="0.16" />
      <rect width={w} height={h} rx="16" fill="#fff" />
      <path d={`M0 16 a16 16 0 0 1 16 -16 h${w - 32} a16 16 0 0 1 16 16 v24 h-${w}z`} fill="#e9eef6" />
      <circle cx="20" cy="20" r="5" fill="#ff6159" />
      <circle cx="36" cy="20" r="5" fill="#ffbd2e" />
      <circle cx="52" cy="20" r="5" fill="#28c840" />
      <rect x="74" y="9" width={Math.min(260, w - 100)} height="22" rx="11" fill="#fff" />
      <circle cx="88" cy="20" r="5" fill={tone} />
      <text x="100" y="25" fontSize="12.5" fontWeight={700} fill="#44546a">
        {title}
      </text>
      <g transform="translate(0 40)">{children}</g>
    </g>
  );
}

/** A white document with a title and lines of text (the brain sheet). `show` reveals the lines one by one. */
export function Sheet({ x, y, w = 260, title, lines, show = true, scale = 1 }: { x: number; y: number; w?: number; title: string; lines: string[]; show?: boolean; scale?: number }) {
  const h = 62 + lines.length * 28;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="6" y="10" width={w} height={h} rx="14" fill="#0a1a33" opacity="0.15" />
      <rect width={w} height={h} rx="14" fill="#fff" />
      <rect width={w} height="10" rx="5" fill="#f2b134" />
      <text x="18" y="42" fontSize="18" fontWeight={800} fill="#1563d6" fontFamily="var(--font-heading)">
        {title}
      </text>
      {lines.map((l, i) => (
        <Appear key={l} show={show} from="left" delay={i * 260}>
          <text x="18" y={74 + i * 28} fontSize="14.5" fontWeight={600} fill="#0a1a33">
            {l}
          </text>
        </Appear>
      ))}
    </g>
  );
}

/** A tool's button. */
export function Button({ x, y, w, text, tone = "#1563d6", pressed = false }: { x: number; y: number; w: number; text: string; tone?: string; pressed?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height="38" rx="10" fill={tone} opacity={pressed ? 0.75 : 1} />
      <text x={w / 2} y="25" fontSize="15" fontWeight={800} fill="#fff" textAnchor="middle">
        {text}
      </text>
      {pressed && <Tick x={w - 4} y={2} r={13} />}
    </g>
  );
}

/** "Next: Lesson N · Title" pill for the end of a lesson. */
export function NextLesson({ show, text }: { show: boolean; text: string }) {
  const w = 40 + text.length * 10.2;
  return (
    <Appear show={show} from="up">
      <g transform={`translate(${910 - w} 446)`}>
        <rect width={w} height="52" rx="26" fill="#0a1a33" />
        <text x={w / 2} y="33" fontSize="18" fontWeight={700} fill="#ffd45c" textAnchor="middle">
          {text}
        </text>
      </g>
    </Appear>
  );
}

/** A simple WhatsApp-style chat icon (green bubble) or an Instagram-style camera (no real logos). */
export function ChannelIcon({ x, y, kind, size = 80 }: { x: number; y: number; kind: "whatsapp" | "instagram"; size?: number }) {
  const s = size / 80;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {kind === "whatsapp" ? (
        <>
          <circle r="40" fill="#25b763" />
          <path d="M-20 26 l6 -16 a24 24 0 1 1 10 10z" fill="#fff" />
          <path d="M-8 -8 q2 14 16 18" stroke="#25b763" strokeWidth="6" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <defs>
            <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#f9a03f" />
              <stop offset="0.5" stopColor="#e2447a" />
              <stop offset="1" stopColor="#8a3fd1" />
            </linearGradient>
          </defs>
          <rect x="-40" y="-40" width="80" height="80" rx="22" fill="url(#ig-grad)" />
          <rect x="-24" y="-24" width="48" height="48" rx="14" fill="none" stroke="#fff" strokeWidth="6" />
          <circle r="11" fill="none" stroke="#fff" strokeWidth="6" />
          <circle cx="16" cy="-16" r="3.5" fill="#fff" />
        </>
      )}
    </g>
  );
}
