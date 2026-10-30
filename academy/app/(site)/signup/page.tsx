import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "../login/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : undefined;
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h1 className="font-display text-2xl font-semibold text-ink">Create your student account</h1>
        <p className="mt-1 text-sm text-muted">You&apos;ll use it to join classes, hand in work and download your certificate.</p>
        <div className="mt-6">
          <SignupForm next={nextPath} />
        </div>
        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href={`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`} className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
