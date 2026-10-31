"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/academy", label: "Academy" },
  { href: "/admin/whatsapp", label: "WhatsApp agent" },
  { href: "/admin/projects", label: "Projects" },
];

export function AdminNav({ badges }: { badges: Partial<Record<string, number>> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const badge = badges[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors",
              active ? "bg-primary text-primary-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {item.label}
            {badge ? (
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-white/25" : "bg-primary-soft text-primary")}>{badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
