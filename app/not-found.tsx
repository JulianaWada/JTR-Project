import Link from "next/link";
import "./globals.css";

// Shown for URLs outside any locale (rare, since the proxy adds /en).
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-bg p-6 text-ink">
        <main className="max-w-md text-center">
          <p className="font-display text-6xl font-semibold text-primary">404</p>
          <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
          <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
          <Link href="/en" className="mt-6 inline-block rounded-full bg-primary px-5 py-3 font-medium text-primary-ink">
            Go to the home page
          </Link>
        </main>
      </body>
    </html>
  );
}
