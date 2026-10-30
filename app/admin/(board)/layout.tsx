import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin/auth";
import { siteCounts } from "@/lib/admin/site-data";
import { databaseMode } from "@/lib/db";
import { logout } from "../actions";

export default async function BoardLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const counts = await siteCounts();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/admin" aria-label="Admin overview">
              <Logo alt="JTR" size={34} />
            </Link>
            <form action={logout} className="lg:hidden">
              <button type="submit" className="text-sm font-semibold text-muted hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
          <AdminNav badges={{ "/admin/leads": counts.newLeads, "/admin/academy": counts.newInterest }} />
          <div className="hidden items-center gap-4 lg:flex">
            <Link href="/en" className="text-sm font-semibold text-muted hover:text-ink">
              View site
            </Link>
            <form action={logout}>
              <button type="submit" className="text-sm font-semibold text-muted hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {databaseMode() === "pglite" && (
        <div className="border-b border-line bg-amber-500/10 px-4 py-2 text-center text-xs text-ink">
          Test mode: the website is using its built-in test database. Set DATABASE_URL to keep leads and sign-ups permanently.
        </div>
      )}
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
