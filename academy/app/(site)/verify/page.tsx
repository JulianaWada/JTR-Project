import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Verify a certificate" };

async function lookup(form: FormData) {
  "use server";
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  if (code) redirect(`/verify/${encodeURIComponent(code)}`);
}

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h1 className="font-display text-2xl font-semibold text-ink">Verify a certificate</h1>
        <p className="mt-1 text-sm text-muted">Enter the certificate ID printed at the bottom right of a JTR Academy certificate.</p>
        <form action={lookup} className="mt-6 flex gap-2">
          <input className="input uppercase" name="code" placeholder="JTR-XXXXX" required aria-label="Certificate ID" />
          <button className="btn-primary">Check</button>
        </form>
      </div>
    </div>
  );
}
