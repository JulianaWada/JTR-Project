import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TestModeBanner } from "@/components/ui";
import { env } from "@/lib/env";
import { LoginForm } from "./auth-forms";

export const metadata: Metadata = { title: "Student login" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  // Teacher pages send people here by old links: hand them to the teacher login.
  if (nextPath && (nextPath === "/teach" || nextPath.startsWith("/teach/"))) redirect(`/teacher-login?next=${encodeURIComponent(nextPath)}`);
  const demo = Boolean(env.demoPassword);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Student login</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Log in to JTR Academy</h1>
        <p className="mt-1 text-sm text-muted">For students: your courses, lessons and certificates.</p>
        <div className="mt-6">
          <LoginForm next={nextPath} demo={demo} />
        </div>
        <p className="mt-6 text-sm text-muted">
          New here?{" "}
          <Link href={`/signup${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-3 border-t border-line pt-4 text-sm text-muted">
          Are you a teacher?{" "}
          <Link href="/teacher-login" className="font-medium text-primary hover:underline">
            Go to the teacher login
          </Link>
        </p>
      </div>
      {demo && (
        <div className="mt-4">
          <TestModeBanner>
            Demo student logins (password <strong>{env.demoPassword}</strong>): <strong>ada@example.com</strong>, graduate{" "}
            <strong>chioma@example.com</strong>.
          </TestModeBanner>
        </div>
      )}
    </div>
  );
}
