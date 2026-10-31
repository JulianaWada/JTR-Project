import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-card border border-line bg-surface shadow-[0_1px_2px_rgba(10,26,51,0.04)]", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
          <div>
            {title && <h2 className="font-display text-[0.95rem] font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const statTones = {
  blue: "bg-[#e3eefc] text-[#1563d6]",
  violet: "bg-[#efe9fd] text-[#6d3fd6]",
  green: "bg-[#e3f5ec] text-[#0f7b4a]",
  amber: "bg-[#fdf1dc] text-[#a15c00]",
} as const;

/** A headline number with an icon. */
export function Stat({
  label,
  value,
  note,
  href,
  icon,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  href?: string;
  icon?: IconName;
  tone?: keyof typeof statTones;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon && (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", statTones[tone])}>
            <Icon name={icon} size={18} />
          </span>
        )}
      </div>
      <p className="mt-1 font-display text-[1.75rem] leading-tight font-semibold text-ink tabular-nums">{value}</p>
      {note && <p className="mt-1.5 text-xs text-muted">{note}</p>}
    </>
  );
  const cls = "block rounded-card border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(10,26,51,0.04)]";
  return href ? (
    <Link href={href} className={cn(cls, "transition-shadow hover:shadow-md")}>
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
        <thead className="bg-surface-2/60 text-[0.7rem] tracking-[0.08em] text-muted uppercase">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-5 py-2.5 font-semibold whitespace-nowrap">
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

/** Shown in place of an app's figures until its database is linked. */
export function NotConnected({ app, envVar, children }: { app: string; envVar: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line bg-surface px-6 py-8 sm:flex-row sm:items-center">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
        <Icon name="shield" size={20} />
      </span>
      <div className="text-sm">
        <p className="font-semibold text-ink">{app} isn&apos;t connected yet</p>
        <p className="mt-0.5 text-muted">
          Add <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink">{envVar}</code> in Vercel (Settings → Environment Variables) and
          redeploy to see real figures here. {children}
        </p>
      </div>
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none";
export const buttonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-ink transition-colors hover:bg-primary/90 disabled:opacity-60";
export const secondaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary";
