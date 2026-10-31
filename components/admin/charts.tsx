import { cn } from "@/lib/cn";

// Small server-rendered charts for the admin board: no chart library, readable without JavaScript.
// Each day or bar carries a native tooltip, and every chart has a text alternative.

const SERIES = { blue: "#1563d6", violet: "#7c4ddb" } as const;

export type Series = { key: string; label: string; color: keyof typeof SERIES; values: number[] };

const shortDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Grouped daily bars on one axis, e.g. leads and sign-ups per day. Built from HTML boxes rather than SVG
 * so the labels stay readable at any width. Hovering a day shows its numbers.
 */
export function DailyBars({ days, series }: { days: string[]; series: Series[] }) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  // A tidy axis: steps of 1, 2, 5, 10, 20... with at most four gaps.
  const step = [1, 2, 5, 10, 20, 50, 100, 200, 500].find((n) => max / n <= 4) ?? Math.ceil(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const labelEvery = Math.ceil(days.length / 7);
  const label = (day: string) => shortDay.format(new Date(`${day}T12:00:00Z`));
  const total = (s: Series) => s.values.reduce((a, b) => a + b, 0);

  return (
    <figure className="px-5">
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: SERIES[s.color] }} aria-hidden="true" />
            {s.label} <span className="font-semibold text-ink tabular-nums">{total(s)}</span>
          </span>
        ))}
      </div>
      <div className="flex gap-2" role="img" aria-label={series.map((s) => `${s.label}: ${total(s)} in the last ${days.length} days`).join(", ")}>
        <div className="relative h-48 w-6 shrink-0 text-right text-[11px] text-muted tabular-nums" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-48">
            {ticks.map((t) => (
              <div
                key={t}
                className={cn("absolute inset-x-0 border-t", t === 0 ? "border-line" : "border-dashed border-line/80")}
                style={{ bottom: `${(t / top) * 100}%` }}
                aria-hidden="true"
              />
            ))}
            <div className="absolute inset-0 flex">
              {days.map((day, i) => (
                <div
                  key={day}
                  className="group flex flex-1 items-end justify-center gap-0.5 hover:bg-surface-2/70"
                  title={`${label(day)}: ${series.map((s) => `${s.values[i]} ${s.label.toLowerCase()}`).join(", ")}`}
                >
                  {series.map((s) => (
                    <div
                      key={s.key}
                      className="w-full max-w-3 rounded-t-[4px]"
                      style={{ height: `${(s.values[i] / top) * 100}%`, background: SERIES[s.color] }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex text-[11px] text-muted" aria-hidden="true">
            {days.map((day, i) => (
              <span key={day} className="flex-1 text-center whitespace-nowrap">
                {i % labelEvery === (days.length - 1) % labelEvery ? label(day) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

/** A ranked list with a bar behind each value: shares of one total (e.g. sign-ups by course). */
export function BarList({
  items,
  format = (n) => String(n),
  color = "blue",
}: {
  items: { label: string; value: number; note?: string }[];
  format?: (n: number) => string;
  color?: keyof typeof SERIES;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3 px-5 pb-5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink">{item.label}</span>
            <span className="font-semibold text-ink tabular-nums">
              {format(item.value)}
              {item.note && <span className="ml-1.5 text-xs font-normal text-muted">{item.note}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-2" title={`${item.label}: ${format(item.value)}`}>
            <div
              className={cn("h-2 rounded-full", item.value === 0 && "hidden")}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: SERIES[color] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
