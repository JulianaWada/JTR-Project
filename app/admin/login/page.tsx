import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { DEMO_ADMIN_PASSWORD, adminEmail, adminPassword, isAdmin, isDemoLogin } from "@/lib/admin/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const open = Boolean(adminPassword());
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8 shadow-sm">
        <Logo alt="JTR" />
        <h1 className="mt-8 font-display text-xl font-semibold text-ink">Admin board</h1>
        {open ? (
          <>
            <p className="mt-1 mb-6 text-sm text-muted">Leads, academy, WhatsApp agent and projects in one place.</p>
            <LoginForm askEmail={Boolean(adminEmail())} />
            {isDemoLogin() && (
              <p className="mt-6 rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs text-muted">
                Test mode: the password is <code className="font-semibold text-ink">{DEMO_ADMIN_PASSWORD}</code>. Set ADMIN_PASSWORD to choose
                your own.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            The admin board is switched off until ADMIN_PASSWORD is set in the website&apos;s environment variables on Vercel.
          </p>
        )}
      </div>
    </main>
  );
}
