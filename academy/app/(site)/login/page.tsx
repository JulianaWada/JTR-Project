import type { Metadata } from "next";
import Link from "next/link";
import { TestModeBanner } from "@/components/ui";
import { env } from "@/lib/env";
import { LoginForm } from "./auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  const demo = Boolean(env.demoPassword);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h1 className="font-display text-2xl font-semibold text-ink">Log in to JTR Academy</h1>
        <p className="mt-1 text-sm text-muted">Students and teachers use the same login.</p>
        <div className="mt-6">
          <LoginForm next={nextPath} demo={demo} />
        </div>
        <p className="mt-6 text-sm text-muted">
          New here?{" "}
          <Link href={`/signup${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
      {demo && (
        <div className="mt-4">
          <TestModeBanner>
            Demo logins (password <strong>{env.demoPassword}</strong>): student <strong>ada@example.com</strong>, graduate{" "}
            <strong>chioma@example.com</strong>, teacher <strong>jules@julestechright.com</strong>.
          </TestModeBanner>
        </div>
      )}
    </div>
  );
}
