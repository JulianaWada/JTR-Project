"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Overview", icon: "trendingUp" },
  { href: "/admin/leads", label: "Leads", icon: "mail" },
  { href: "/admin/academy", label: "Academy", icon: "edtech" },
  { href: "/admin/whatsapp", label: "WhatsApp agent", icon: "whatsapp" },
  { href: "/admin/projects", label: "Projects", icon: "briefcase" },
];

/** The sidebar's links. Badges count items that are waiting for Jules. */
export function AdminNav({ badges }: { badges: Partial<Record<string, number>> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-1">
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const badge = badges[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              active ? "bg-[#1563d6] text-white shadow-sm" : "text-white/65 hover:bg-white/6 hover:text-white",
            )}
          >
            <Icon name={item.icon} size={18}  />
            <span className="flex-1">{item.label}</span>
            {badge ? <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", active ? "bg-white/25 text-white" : "bg-[#1563d6] text-white")}>{badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
