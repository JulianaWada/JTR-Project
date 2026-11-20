import type { Metadata } from "next";
import Link from "next/link";
import { TestModeBanner } from "@/components/ui";
import { env } from "@/lib/env";
import { LoginForm } from "../login/auth-forms";

export const metadata: Metadata = { title: "Teacher login" };

export default async function TeacherLoginPage({ searchParams }: PageProps<"/teacher-login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  const demo = Boolean(env.demoPassword);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card border-t-4 border-t-primary">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Teacher login</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Sign in to teach</h1>
        <p className="mt-1 text-sm text-muted">For JTR Academy teachers and admins: your courses, intakes, marking and sales.</p>
        <div className="mt-6">
          <LoginForm next={nextPath} demo={demo} teacher />
        </div>
        <p className="mt-6 text-sm text-muted">
          Want to teach with JTR?{" "}
          <Link href="/teach-with-us" className="font-medium text-primary hover:underline">
            Apply to teach
          </Link>
        </p>
        <p className="mt-3 border-t border-line pt-4 text-sm text-muted">
          Are you a student?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Go to the student login
          </Link>
        </p>
      </div>
      {demo && (
        <div className="mt-4">
          <TestModeBanner>
            Demo teacher logins (password <strong>{env.demoPassword}</strong>): admin <strong>jules@julestechright.com</strong>, teacher{" "}
            <strong>bisi@example.com</strong>.
          </TestModeBanner>
        </div>
      )}
    </div>
  );
}
