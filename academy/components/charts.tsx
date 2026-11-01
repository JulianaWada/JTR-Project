import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icons";

const chips = {
  blue: "bg-primary-soft text-primary",
  violet: "bg-violet-soft text-violet",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
};

/** A headline number with a tinted icon chip, as on the JTR admin board. */
export function KpiCard({ label, value, hint, icon, tone = "blue" }: { label: string; value: ReactNode; hint?: ReactNode; icon: IconName; tone?: keyof typeof chips }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", chips[tone])}>
          <Icon name={icon} className="size-[18px]" />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function niceMax(max: number) {
  if (max <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (max <= m * step) return m * step;
  return 10 * step;
}

/**
 * Vertical bars over time, one series. Faint dashed gridlines with axis values; the exact value shows on hover
 * (and in the screen-reader table below the chart).
 */
export function BarChart({ data, format, label }: { data: { label: string; value: number }[]; format: (n: number) => string; label: string }) {
  const top = Math.max(...data.map((d) => d.value));
  const max = niceMax(top);
  // With nothing to show yet, only the zero line: no made-up scale.
  const ticks = top > 0 ? [0, 0.5, 1].map((t) => t * max) : [0];
  return (
    <figure>
      <div className="ps-14" aria-hidden>
        <div className="relative h-48">
          {ticks.map((t) => (
            <div key={t} className="pointer-events-none absolute inset-x-0 flex items-center" style={{ bottom: `${(t / max) * 100}%`, transform: "translateY(50%)" }}>
              <span className="absolute -start-14 w-12 text-end text-[0.7rem] text-muted tabular-nums">{format(t)}</span>
              <span className={cn("w-full border-t", t === 0 ? "border-line" : "border-dashed border-line")} />
            </div>
          ))}
          <div className="absolute inset-0 flex items-end gap-3 px-2">
            {data.map((d) => (
              <div key={d.label} className="group relative flex h-full flex-1 items-end justify-center">
                <div
                  className="relative w-full max-w-12 rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-85"
                  style={{ height: `${d.value > 0 ? Math.max(1.5, (d.value / max) * 100) : 0}%` }}
                >
                  <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-xs whitespace-nowrap text-bg group-hover:block">
                    {format(d.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex gap-3 px-2">
          {data.map((d) => (
            <span key={d.label} className="flex-1 text-center text-xs text-muted">
              {d.label}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th>{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Horizontal bars for comparing a few named items; the value is printed at the end of each bar. */
export function BarList({ data, format = String }: { data: { label: ReactNode; value: number; key: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-4">
      {data.map((d) => (
        <li key={d.key}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink">{d.label}</span>
            <span className="font-semibold text-ink tabular-nums">{format(d.value)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
