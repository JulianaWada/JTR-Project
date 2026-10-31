"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({
  href,
  exact,
  children,
  variant = "pill",
}: {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
  /** "sidebar": a full-width row on the navy dashboard sidebar. */
  variant?: "pill" | "sidebar";
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        variant === "sidebar"
          ? "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
          : "shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
        variant === "sidebar"
          ? active
            ? "bg-[#1563d6] text-white shadow-sm"
            : "text-white/65 hover:bg-white/5 hover:text-white"
          : active
            ? "bg-primary-soft text-primary"
            : "text-muted",
      )}
    >
      {children}
    </Link>
  );
}
