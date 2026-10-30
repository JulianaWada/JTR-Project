"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({ href, exact, children }: { href: string; exact?: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
        active ? "bg-primary-soft text-primary" : "text-muted",
      )}
    >
      {children}
    </Link>
  );
}
