"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The lesson's slides, clicked through inside the page like the video: previous and next buttons,
 * arrow keys, swiping on phones, full screen, and a download link for the PowerPoint file.
 */
export function SlideViewer({ title, images, fileUrl }: { title: string; images: string[]; fileUrl: string }) {
  const [index, setIndex] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const last = images.length - 1;
  const go = useCallback((to: number) => setIndex(Math.max(0, Math.min(last, to))), [last]);

  useEffect(() => {
    // Load the next slide early so clicking through feels instant.
    const next = images[index + 1];
    if (next) new Image().src = next;
  }, [images, index]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "Home") go(0);
    else if (e.key === "End") go(last);
  }

  function fullScreen() {
    const el = frame.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }

  return (
    <div>
      <div
        ref={frame}
        tabIndex={0}
        onKeyDown={onKey}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
        className="group relative aspect-video overflow-hidden rounded-card border border-line bg-[#0b1a33] outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-roledescription="slide viewer"
        aria-label={`${title} slides`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- plain images keep the slides crisp at any size */}
        <img src={images[index]} alt={`${title}, slide ${index + 1} of ${images.length}`} className="size-full object-contain" />
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous slide"
          className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize disabled:cursor-default"
        />
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === last}
          aria-label="Next slide"
          className="absolute inset-y-0 right-0 w-3/4 cursor-e-resize disabled:cursor-default"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary px-3" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide">
          ←
        </button>
        <span className="min-w-16 text-center text-sm tabular-nums text-muted" aria-live="polite">
          {index + 1} / {images.length}
        </span>
        <button type="button" className="btn-primary px-3" onClick={() => go(index + 1)} disabled={index === last} aria-label="Next slide">
          →
        </button>
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={fullScreen}>
            ⛶ Full screen
          </button>
          <a href={fileUrl} download className="btn-secondary text-sm">
            ↓ PowerPoint
          </a>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((index + 1) / images.length) * 100}%` }} />
      </div>
    </div>
  );
}
