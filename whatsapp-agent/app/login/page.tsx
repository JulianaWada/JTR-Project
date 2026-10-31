import type { Metadata } from "next";
import { env } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  const showDemo = !env.isProduction || !!process.env.DEMO_PASSWORD;
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <p className="text-sm tracking-[0.3em] text-silver uppercase">Jules TechRight</p>
          <h1 className="mt-2 text-2xl font-semibold">WhatsApp Agent</h1>
          <p className="mt-1 text-sm text-silver">Owner dashboard</p>
        </div>
        <div className="card">
          <LoginForm defaultBusiness={showDemo ? "glow-up-studio" : undefined} />
          {showDemo && (
            <p className="mt-4 text-xs text-slate-500">
              Demo businesses: <code>glow-up-studio</code> (salon) and <code>mama-nkechi-kitchen</code> (food).
              {!env.isProduction && (
                <>
                  {" "}
                  Local password: <code>{env.demoPassword}</code>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
