import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/(site)/login/actions";
import { modes } from "@/lib/env";
import { Icon, type IconName } from "./icons";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";
import { asset } from "@/lib/assets";

export type ShellItem = { href: string; label: string; icon: IconName; exact?: boolean; badge?: number };

function Brand({ area }: { area: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size brand mark */}
      <img src={asset("/brand/jtr-emblem.png")} alt="" width={34} height={34} className="shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-[0.12em] text-white">JTR</span>
        <span className="mt-1 text-[0.65rem] font-medium tracking-[0.18em] text-white/60 uppercase">{area}</span>
      </span>
    </span>
  );
}

function Menu({ items, footer }: { items: ShellItem[]; footer: { href: string; label: string; icon: IconName }[] }) {
  return (
    <>
      <p className="px-3 text-[0.7rem] font-semibold tracking-[0.14em] text-white/40 uppercase">Menu</p>
      <nav aria-label="Main" className="mt-2 flex flex-col gap-1">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href} exact={item.exact} variant="sidebar">
            <Icon name={item.icon} className="size-[18px] shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? <span className="rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-semibold text-white">{item.badge}</span> : null}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        {footer.map((f) => (
          <Link key={f.href} href={f.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white">
            <Icon name={f.icon} className="size-[18px]" />
            {f.label}
          </Link>
        ))}
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white">
            <Icon name="logout" className="size-[18px]" />
            Log out
          </button>
        </form>
      </div>
    </>
  );
}

/** Dashboard frame for the signed-in areas: navy sidebar on desktop, navy top bar with a menu on phones. */
export function AppShell({
  user,
  items,
  children,
  home,
  area,
}: {
  user: { name: string; role: string };
  items: ShellItem[];
  children: ReactNode;
  home: string;
  /** Shown under the logo, e.g. "Teaching". */
  area: string;
}) {
  const m = modes();
  const testServices = [m.paystack === "test" && "payments", m.claude === "test" && "AI tutor", m.email === "test" && "emails"].filter(Boolean);
  const footer: { href: string; label: string; icon: IconName }[] =
    user.role === "teacher" && home === "/teach" ? [{ href: "/", label: "View academy site", icon: "globe" }] : [{ href: "/", label: "All courses", icon: "compass" }];
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[16rem_1fr]">
      <div className="hidden bg-sidebar lg:block">
        <aside className="sticky top-0 flex h-screen flex-col px-4 py-6">
          <Link href={home} className="mb-8 rounded-lg px-2">
            <Brand area={area} />
          </Link>
          <Menu items={items} footer={footer} />
        </aside>
      </div>

      <div className="min-w-0">
        {/* Phones and tablets: a navy bar with the same menu behind a button. */}
        <details className="group sticky top-0 z-40 bg-sidebar lg:hidden">
          <summary className="flex h-16 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
            <Brand area={area} />
            <span className="inline-grid size-10 place-items-center rounded-xl text-white/80 group-open:bg-white/10" aria-label="Open the menu">
              <Icon name="menu" />
            </span>
          </summary>
          <div className="flex flex-col px-4 pb-4">
            <Menu items={items} footer={footer} />
          </div>
        </details>

        <header className="flex h-16 items-center justify-end gap-2 border-b border-line bg-surface/80 px-4 backdrop-blur-md sm:px-8">
          {testServices.length > 0 && (
            <span className="me-auto hidden rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning sm:inline">
              Test mode: {testServices.join(", ")} not live yet
            </span>
          )}
          <ThemeToggle />
          <span className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{initials}</span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold text-ink">{user.name}</span>
              <span className="text-xs text-muted">{user.role === "teacher" ? "Teacher" : "Student"}</span>
            </span>
          </span>
        </header>
        {testServices.length > 0 && (
          <p className="border-b border-warning/20 bg-warning-soft px-4 py-1.5 text-center text-xs text-warning sm:hidden">
            Test mode for {testServices.join(", ")}: nothing real is charged or sent until the keys are added.
          </p>
        )}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
