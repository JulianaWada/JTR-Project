import { logout } from "@/app/login/actions";
import { NavLink } from "@/components/nav-link";
import { attentionCount } from "@/lib/agent/run";
import { requireTenant } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { modes } from "@/lib/env";

function ModeBadge({ label, live }: { label: string; live: boolean }) {
  return (
    <span className={`pill ${live ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
      {label}: {live ? "live" : "test"}
    </span>
  );
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await requireTenant();
  const db = await getDb();
  const waiting = await attentionCount(db, tenant.id);
  const m = modes();
  const isFood = tenant.kind === "food";

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-navy text-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[11px] tracking-[0.25em] text-silver uppercase">JTR Agent</p>
          <p className="mt-1 truncate text-base font-semibold">{tenant.name}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible">
          <NavLink href="/dashboard">Overview</NavLink>
          <NavLink href="/dashboard/chats" badge={waiting}>
            Chats
          </NavLink>
          {isFood ? <NavLink href="/dashboard/orders">Orders</NavLink> : <NavLink href="/dashboard/bookings">Bookings</NavLink>}
          {tenant.kind === "other" && <NavLink href="/dashboard/orders">Orders</NavLink>}
          <NavLink href="/dashboard/payments">Payments</NavLink>
          <NavLink href="/dashboard/settings">Business details</NavLink>
          <NavLink href="/dashboard/simulator">Try the agent</NavLink>
        </nav>
        <div className="hidden px-4 pb-5 md:mt-auto md:block">
          <div className="flex flex-wrap gap-1.5">
            <ModeBadge label="AI" live={m.claude === "live"} />
            <ModeBadge label="WhatsApp" live={m.whatsapp === "live"} />
            <ModeBadge label="Paystack" live={m.paystack === "live"} />
          </div>
          <form action={logout} className="mt-4">
            <button className="text-sm text-silver hover:text-white">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
