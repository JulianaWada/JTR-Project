import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-card border border-line bg-surface", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          {title && <h2 className="font-display text-base font-semibold text-ink">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, href }: { label: string; value: ReactNode; note?: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink tabular-nums">{value}</p>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
    </>
  );
  const cls = "block rounded-card border border-line bg-surface p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-primary")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** A table that scrolls sideways on small screens instead of squashing its columns. */
export function Table({ head, children, empty, compact }: { head: string[]; children: ReactNode; empty?: string; compact?: boolean }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-sm", compact ? "min-w-[28rem]" : "min-w-[40rem]")}>
        <thead className="text-xs tracking-wide text-muted uppercase">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-5 py-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line border-t border-line">{children}</tbody>
      </table>
      {!hasRows && <p className="px-5 py-8 text-center text-sm text-muted">{empty ?? "Nothing here yet."}</p>}
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-5 py-3 align-top", className)}>{children}</td>;
}

const tones = {
  neutral: "bg-surface-2 text-muted",
  blue: "bg-primary-soft text-primary",
  green: "bg-success/12 text-success",
  red: "bg-danger/10 text-danger",
  amber: "bg-amber-500/15 text-amber-700",
} as const;

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone])}>{children}</span>;
}

/** Colour for the status words used across the apps. */
export function statusTone(status: string): keyof typeof tones {
  if (["success", "paid", "completed", "active", "live", "done", "confirmed"].includes(status)) return "green";
  if (["failed", "cancelled", "expired", "abandoned", "no_show"].includes(status)) return "red";
  if (["new", "pending", "awaiting_payment", "pending_payment", "in-progress"].includes(status)) return "amber";
  return "blue";
}

export function humanise(status: string) {
  const s = status.replace(/[_-]/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function SampleNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/8 px-4 py-3 text-sm text-ink">
      <strong className="font-semibold">Sample data.</strong> {children}
    </p>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none";
export const buttonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary/90 disabled:opacity-60";
export const secondaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary";
