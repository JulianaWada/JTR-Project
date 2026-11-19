"use client";

import type { ReactNode } from "react";
import { Appear, Laptop, Tick, Typed } from "../cartoon";

/* Pieces several lessons reuse. */

/** A message bubble on a phone screen (the screen is 150 wide). `me` = sent by the shop (green, right). */
export function Msg({ y, text, me = false, show = true, delay = 0, width = 118 }: { y: number; text: string[]; me?: boolean; show?: boolean; delay?: number; width?: number }) {
  const h = text.length * 13 + 12;
  const x = me ? 150 - width - 6 : 6;
  return (
    <Appear show={show} from="up" delay={delay}>
      <g transform={`translate(${x} ${y})`}>
        <rect width={width} height={h} rx="8" fill={me ? "#dcf8c6" : "#ffffff"} />
        {text.map((t, i) => (
          <text key={i} x="7" y={15 + i * 13} fontSize="9.5" fill="#1b1b1b">
            {t}
          </text>
        ))}
        {me && (
          <text x={width - 6} y={h - 4} fontSize="7" fill="#34b7f1" textAnchor="end">
            ✓✓
          </text>
        )}
      </g>
    </Appear>
  );
}

/** A laptop with an AI chat: the prompt types itself, then the reply lines appear one by one. */
export function AiChat({
  x,
  y,
  scale = 1,
  prompt,
  reply = [],
  showPrompt = true,
  showReply = false,
  replyTitle,
}: {
  x: number;
  y: number;
  scale?: number;
  prompt: string[];
  reply?: string[];
  showPrompt?: boolean;
  showReply?: boolean;
  replyTitle?: string;
}) {
  const promptH = prompt.length * 17 + 14;
  return (
    <Laptop x={x} y={y} scale={scale}>
      <Appear show={showPrompt} from="up">
        <g transform={`translate(${340 - 300} 0)`}>
          <rect width="300" height={promptH} rx="12" fill="#1563d6" />
          {prompt.map((line, i) => (
            <Typed key={i} text={line} show={showPrompt} delay={i * 900} x="12" y={20 + i * 17} fontSize="12.5" fontWeight={600} fill="#fff" />
          ))}
        </g>
      </Appear>
      <Appear show={showReply} from="up">
        <g transform={`translate(0 ${promptH + 8})`}>
          <rect width="320" height={Math.min(190 - promptH - 8, (reply.length + (replyTitle ? 1 : 0)) * 20 + 12)} rx="12" fill="#eef1f6" />
          {replyTitle && (
            <text x="12" y="20" fontSize="12.5" fontWeight={700} fill="#1563d6">
              {replyTitle}
            </text>
          )}
          {reply.map((t, i) => (
            <Appear key={t} show={showReply} from="left" delay={250 + i * 450}>
              <text x="12" y={(replyTitle ? 40 : 20) + i * 20} fontSize="12.5" fontWeight={600} fill="#0a1a33">
                {t}
              </text>
            </Appear>
          ))}
        </g>
      </Appear>
    </Laptop>
  );
}

/** A white card with a heading. */
export function Card({ x, y, w, h, title, tone = "#1563d6", children }: { x: number; y: number; w: number; h: number; title?: string; tone?: string; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="6" y="10" width={w} height={h} rx="22" fill="#0a1a33" opacity="0.15" />
      <rect width={w} height={h} rx="22" fill="#fff" />
      {title && (
        <text x="24" y="40" fontSize="20" fontWeight={700} fill={tone} fontFamily="var(--font-heading)">
          {title}
        </text>
      )}
      {children}
    </g>
  );
}

/** A to-do list whose ticks pop in as the steps go by. `at` is the step each item gets its tick. */
export function Checklist({ x, y, items, step, gap = 56, size = 19 }: { x: number; y: number; items: [string, number][]; step: number; gap?: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {items.map(([text, at], i) => (
        <g key={text} transform={`translate(0 ${i * gap})`}>
          <rect width="30" height="30" rx="8" fill="#fff" stroke="#c7d2de" strokeWidth="3" />
          <Appear show={step >= at} from="pop" delay={300 + (i % 2) * 400}>
            <Tick x={15} y={15} r={17} />
          </Appear>
          <text x="46" y="22" fontSize={size} fontWeight={600} fill="#0a1a33">
            {text}
          </text>
        </g>
      ))}
    </g>
  );
}

/** A small social post: the shop's name, a coloured picture area (children) and caption lines. */
export function Post({ x, y, scale = 1, lines, children }: { x: number; y: number; scale?: number; lines: ReactNode; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="6" y="10" width="300" height="400" rx="22" fill="#0a1a33" opacity="0.16" />
      <rect width="300" height="400" rx="22" fill="#fff" />
      <circle cx="30" cy="30" r="14" fill="#e4572e" />
      <text x="52" y="35" fontSize="14" fontWeight={700} fill="#0a1a33">
        Amaka&apos;s Styles
      </text>
      <rect x="14" y="56" width="272" height="170" rx="12" fill="#fbe7cf" />
      {children}
      {lines}
    </g>
  );
}

/** A dress on a hanger, for product pictures. */
export function Dress({ x, y, colour = "#e4572e", scale = 1 }: { x: number; y: number; colour?: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 q0 -12 10 -12" stroke="#555" strokeWidth="3" fill="none" />
      <path d="M-22 10 L22 10 L36 130 L-36 130Z" fill={colour} />
      <path d="M-22 10 L22 10 L36 130 L-36 130Z" fill="#fff" opacity="0.12" />
      <circle cx="-8" cy="50" r="4" fill="#fff" opacity="0.5" />
      <circle cx="10" cy="90" r="4" fill="#fff" opacity="0.5" />
    </g>
  );
}

/** A price tag. */
export function PriceTag({ x, y, text, tone = "#f2b134" }: { x: number; y: number; text: string; tone?: string }) {
  const w = 30 + text.length * 13;
  return (
    <g transform={`translate(${x} ${y}) rotate(-6)`}>
      <path d={`M0 0 L${w} 0 L${w + 22} 22 L${w} 44 L0 44Z`} fill={tone} />
      <circle cx={w + 6} cy="22" r="5" fill="#fff" />
      <text x="14" y="30" fontSize="22" fontWeight={800} fill="#0a1a33">
        {text}
      </text>
    </g>
  );
}
