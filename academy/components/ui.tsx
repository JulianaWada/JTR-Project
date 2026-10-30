import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ProgressBar({ value, className, tone = "primary" }: { value: number; className?: string; tone?: "primary" | "success" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full", tone === "success" ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "violet" }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger/10 text-danger",
    violet: "bg-violet-soft text-violet",
  };
  return <span className={cn("pill", tones[tone])}>{children}</span>;
}

export function PageTitle({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {children && <div className="mt-2 max-w-2xl text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">{children}</p>;
}

/** Course colour on cards: blue for sales, violet for animation. */
export function accentClasses(accent: "blue" | "violet") {
  return accent === "violet"
    ? { soft: "bg-violet-soft", text: "text-violet", border: "border-violet/40", gradient: "from-violet/25" }
    : { soft: "bg-primary-soft", text: "text-primary", border: "border-primary/40", gradient: "from-primary/25" };
}

export function TestModeBanner({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-2.5 text-sm text-warning">{children}</p>;
}

/** The "Saved" / error line teacher actions send back in the address. */
export async function Flash({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { saved, error } = await searchParams;
  if (typeof error === "string") return <p className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>;
  if (typeof saved === "string") return <p className="mb-6 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">✓ {saved}</p>;
  return null;
}
