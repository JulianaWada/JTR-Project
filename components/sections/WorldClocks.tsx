"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { timeZoneCoverage } from "@/content/site";

/** Live local times for the cities we cover, formatted for the visitor's language. */
export function WorldClocks({ labels }: { labels: Record<string, string> }) {
  const locale = useLocale();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the time is only rendered on the client to avoid hydration mismatch
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {timeZoneCoverage.map(({ city, tz }) => (
        <li key={city} className="rounded-xl border border-line bg-surface px-4 py-3">
          <p className="text-sm text-muted">{labels[city]}</p>
          <p className="font-display mt-1 text-xl font-semibold tabular-nums text-ink" suppressHydrationWarning>
            {now
              ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(now)
              : "--:--"}
          </p>
        </li>
      ))}
    </ul>
  );
}
