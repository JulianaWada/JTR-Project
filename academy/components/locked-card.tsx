import type { ReactNode } from "react";

/** Shown to students in place of a live class's resources until the class day. */
export function LockedCard({ opens, children }: { opens: string; children: ReactNode }) {
  return (
    <div className="card mt-6 border-primary/40 text-center">
      <p className="text-3xl" aria-hidden>
        🔒
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold text-ink">Opens on {opens}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{children}</p>
    </div>
  );
}
