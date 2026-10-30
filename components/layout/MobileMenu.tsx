"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { academyNav, mainNav } from "@/lib/nav";
import { Icon } from "@/components/ui/Icon";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function MobileMenu() {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the menu after navigating.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with route changes
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t("a11y.closeMenu") : t("a11y.openMenu")}
        onClick={() => setOpen((v) => !v)}
        className="inline-grid size-10 place-items-center rounded-full text-ink hover:bg-surface-2"
      >
        <Icon name={open ? "close" : "menu"} size={22} />
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label={t("a11y.mainNav")}
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-bg px-4 pt-4 pb-10"
        >
          <ul className="flex flex-col">
            {mainNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block border-b border-line py-4 font-display text-xl font-medium",
                      active ? "text-primary" : "text-ink",
                    )}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              );
            })}
            {academyNav && (
              <li>
                <a href={academyNav.href} className="block border-b border-line py-4 font-display text-xl font-medium text-ink">
                  {t(`nav.${academyNav.key}`)}
                </a>
              </li>
            )}
            <li>
              <Link href="/assistant" className="flex items-center gap-2 border-b border-line py-4 font-display text-xl font-medium text-ink">
                <Icon name="sparkle" size={20} className="text-primary" />
                {t("nav.assistant")}
              </Link>
            </li>
          </ul>
          <Link href="/contact" className={buttonClasses("primary", "lg", "mt-8 w-full")}>
            {t("nav.startProject")}
          </Link>
        </nav>
      )}
    </div>
  );
}
