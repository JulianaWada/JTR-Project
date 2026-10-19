"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { mainNav } from "@/lib/nav";
import { cn } from "@/lib/cn";

export function NavLinks() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {mainNav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                active ? "text-primary" : "text-muted",
              )}
            >
              {t(item.key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
