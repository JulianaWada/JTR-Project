import { BadgeIcon } from "./badge-icon";
import { BADGES, BADGE_ORDER, type BadgeKey } from "@/lib/badges";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/time";

export function BadgeGrid({ earned, compact }: { earned: { badge: string; awardedAt: Date }[]; compact?: boolean }) {
  const byKey = new Map(earned.map((b) => [b.badge, b]));
  if (compact) {
    return (
      <ul className="space-y-2">
        {BADGE_ORDER.map((key) => {
          const got = byKey.has(key);
          return (
            <li key={key} className={cn("flex items-center gap-3 rounded-lg px-2 py-1.5", got ? "bg-primary-soft" : "opacity-60")}>
              <BadgeIcon badge={key} earned={got} className="size-8" />
              <span className="flex-1 text-sm font-medium text-ink">{BADGES[key].name}</span>
              <span className="text-xs text-muted">{got ? "Earned" : "Not yet"}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {BADGE_ORDER.map((key: BadgeKey) => {
        const badge = BADGES[key];
        const got = byKey.get(key);
        return (
          <li
            key={key}
            className={cn("rounded-xl border p-4 text-center", got ? "border-primary/30 bg-primary-soft" : "border-dashed border-line bg-surface opacity-70")}
          >
            <BadgeIcon badge={key} earned={!!got} className="mx-auto size-14" />
            <p className="mt-2 text-sm font-semibold text-ink">{badge.name}</p>
            <p className="mt-0.5 text-xs text-muted">{badge.description}</p>
            <p className="mt-2 text-[0.7rem] font-medium text-muted">{got ? `Earned ${formatDate(got.awardedAt)}` : "Not yet"}</p>
          </li>
        );
      })}
    </ul>
  );
}
