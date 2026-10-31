import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/admin/auth";
import { siteCounts } from "@/lib/admin/site-data";
import { databaseMode } from "@/lib/db";
import { logout } from "../actions";

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3" aria-label="Admin overview">
      <Image src="/brand/jtr-emblem.png" alt="" width={36} height={36} className="shrink-0" />
      <span className="leading-tight">
        <span className="block font-display text-base font-bold tracking-[0.12em] text-white">JTR</span>
        <span className="block text-[0.65rem] font-medium tracking-[0.18em] text-white/55 uppercase">Admin</span>
      </span>
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="space-y-1 border-t border-white/10 pt-4">
      <Link href="/en" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/65 hover:bg-white/6 hover:text-white">
        <Icon name="globe" size={18} />
        View website
      </Link>
      <form action={logout}>
        <button type="submit" className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/65 hover:bg-white/6 hover:text-white">
          <Icon name="arrowRight" size={18} />
          Sign out
        </button>
      </form>
    </div>
  );
}

export default async function BoardLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const counts = await siteCounts();
  const badges = { "/admin/leads": counts.newLeads, "/admin/academy": counts.newInterest };
  const testMode = databaseMode() === "pglite";

  return (
    <div className="min-h-screen bg-[#f3f5f9] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <div className="hidden bg-[#0a1a33] lg:block">
      <aside className="sticky top-0 flex h-screen flex-col gap-8 px-4 py-6">
        <div className="px-2">
          <Brand />
        </div>
        <div className="flex-1">
          <p className="mb-2 px-3 text-[0.7rem] font-semibold tracking-[0.14em] text-white/40 uppercase">Menu</p>
          <AdminNav badges={badges} />
        </div>
        <SidebarFooter />
      </aside>
      </div>

      {/* Mobile top bar with a menu */}
      <details className="group sticky top-0 z-30 bg-[#0a1a33] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 [&::-webkit-details-marker]:hidden">
          <Brand />
          <span className="grid size-10 place-items-center rounded-xl text-white hover:bg-white/10" aria-label="Menu">
            <Icon name="menu" size={22} className="group-open:hidden" />
            <Icon name="close" size={22} className="hidden group-open:block" />
          </span>
        </summary>
        <div className="space-y-4 px-4 pb-5">
          <AdminNav badges={badges} />
          <SidebarFooter />
        </div>
      </details>

      <div className="min-w-0">
        {testMode && (
          <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
            <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
            Test mode: using the built-in test database. Set DATABASE_URL in Vercel to keep leads and sign-ups permanently.
          </div>
        )}
        <main className="mx-auto max-w-[90rem] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
