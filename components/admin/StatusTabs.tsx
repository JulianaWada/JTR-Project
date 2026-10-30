import Link from "next/link";
import { cn } from "@/lib/cn";

/** Filter links: All, New, Contacted, Done. */
export function StatusTabs({ base, current }: { base: string; current?: string }) {
  const tabs = [
    { value: undefined, label: "All" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "done", label: "Done" },
  ];
  return (
    <div className="flex gap-1">
      {tabs.map((t) => (
        <Link
          key={t.label}
          href={t.value ? `${base}?status=${t.value}` : base}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-semibold",
            current === t.value ? "bg-ink text-bg" : "text-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function parseStatus(value: string | string[] | undefined) {
  return value === "new" || value === "contacted" || value === "done" ? value : undefined;
}
