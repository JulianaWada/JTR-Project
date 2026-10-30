import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/(site)/login/actions";
import { modes } from "@/lib/env";
import { Logo } from "./logo";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

type Item = { href: string; label: string; exact?: boolean };

/** Header for the signed-in areas (student and teacher). */
export function AppShell({ user, items, children, home }: { user: { name: string; role: string }; items: Item[]; children: ReactNode; home: string }) {
  const m = modes();
  const testServices = [m.paystack === "test" && "payments", m.claude === "test" && "AI tutor", m.email === "test" && "emails"].filter(Boolean);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-site items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={home} className="rounded-lg">
            <Logo size={34} />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <NavLink key={item.href} href={item.href} exact={item.exact}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
            <form action={logout}>
              <button className="btn-secondary btn-sm ms-2">Log out</button>
            </form>
          </div>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto border-t border-line/70 px-3 py-2 md:hidden">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} exact={item.exact}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      {testServices.length > 0 && (
        <p className="border-b border-warning/20 bg-warning-soft px-4 py-1.5 text-center text-xs text-warning">
          Test mode for {testServices.join(", ")}: nothing real is charged or sent until the keys are added.
        </p>
      )}
      <main className="mx-auto max-w-site px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
