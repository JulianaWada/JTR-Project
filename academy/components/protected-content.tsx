"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Content protection for paid lessons. None of this can stop someone filming their screen (no website can),
 * but it removes the easy ways to copy a lesson, and the watermark shows whose account any copy came from.
 */

/** Places the moving name moves between, as [left %, top %]. */
// Away from the top-left corner, where scenes and slides show their heading.
const SPOTS = [
  [58, 30],
  [8, 62],
  [34, 44],
  [56, 74],
  [10, 30],
  [62, 52],
] as const;
const MOVE_EVERY_MS = 12_000;

/** The student's name and email over the lesson: one clear label that moves around, and a faint pattern behind it. */
export function Watermark({ text }: { text: string }) {
  const [spot, setSpot] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSpot((s) => (s + 1) % SPOTS.length), MOVE_EVERY_MS);
    return () => clearInterval(timer);
  }, []);
  const [left, top] = SPOTS[spot];
  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none overflow-hidden" aria-hidden="true" data-watermark>
      <div className="absolute inset-[-20%] grid rotate-[-18deg] grid-cols-3 content-around gap-y-16 opacity-[0.08]">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="truncate px-4 text-center text-xs font-semibold text-white mix-blend-difference sm:text-sm">
            {text}
          </span>
        ))}
      </div>
      <span
        className="absolute max-w-[60%] truncate rounded bg-black/25 px-2 py-0.5 text-[10px] font-medium text-white/70 transition-all duration-1000 sm:text-xs"
        style={{ left: `${left}%`, top: `${top}%` }}
      >
        {text}
      </span>
    </div>
  );
}

/** Stops the right-click menu ("Save image as…", "Save audio as…") and dragging pictures out of the page. */
export const noCopyProps = {
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  onDragStart: (e: React.DragEvent) => e.preventDefault(),
};

/**
 * A lesson video (YouTube, Vimeo, Loom or Google Drive player) with the watermark over it. Students get full screen
 * from our own button, so the watermark stays on screen; the player's own full-screen button is turned off for them.
 */
export function ProtectedVideo({ src, title, watermark }: { src: string; title: string; watermark: string | null }) {
  const frame = useRef<HTMLDivElement>(null);
  function fullScreen() {
    const el = frame.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }
  return (
    <div>
      <div ref={frame} {...noCopyProps} className="relative aspect-video overflow-hidden rounded-card border border-line bg-black print:hidden [&:fullscreen]:rounded-none">
        <iframe
          src={src}
          title={title}
          className="size-full"
          allow={`accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture${watermark ? "" : "; fullscreen"}`}
          allowFullScreen={!watermark}
          referrerPolicy="strict-origin-when-cross-origin"
        />
        {watermark && <Watermark text={watermark} />}
      </div>
      {watermark && (
        <div className="mt-2 flex justify-end print:hidden">
          <button type="button" className="btn-secondary btn-sm" onClick={fullScreen}>
            ⛶ Full screen
          </button>
        </div>
      )}
    </div>
  );
}
