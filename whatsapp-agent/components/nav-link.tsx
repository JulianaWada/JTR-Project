"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: number }) {
  const pathname = usePathname();
  const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition",
        active ? "bg-white/10 text-white" : "text-silver hover:bg-white/5 hover:text-white",
      )}
    >
      {children}
      {!!badge && <span className="ml-2 rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">{badge}</span>}
    </Link>
  );
}
