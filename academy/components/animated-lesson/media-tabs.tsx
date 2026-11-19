"use client";

import { useState, type ReactNode } from "react";

/** Two ways to take a lesson: the animated lesson (first) and the teacher's video. */
export function MediaTabs({ tabs }: { tabs: { label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0);
  if (tabs.length === 1) return <>{tabs[0].content}</>;
  return (
    <div>
      <div role="tablist" aria-label="How to take this lesson" className="mb-3 inline-flex rounded-full border border-line bg-surface p-1">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${active === i ? "bg-primary text-primary-ink" : "text-muted hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.label} role="tabpanel" hidden={active !== i}>
          {active === i && t.content}
        </div>
      ))}
    </div>
  );
}
