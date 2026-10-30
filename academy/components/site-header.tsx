import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-site items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="JTR Academy home" className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Academy" className="hidden items-center gap-1 text-sm font-medium text-muted md:flex">
          <Link href="/#courses" className="rounded-full px-3 py-2 hover:text-primary">
            Courses
          </Link>
          <Link href="/#how-it-works" className="rounded-full px-3 py-2 hover:text-primary">
            How it works
          </Link>
          <Link href="/verify" className="rounded-full px-3 py-2 hover:text-primary">
            Verify a certificate
          </Link>
          {/* The website is another app, so this is a plain link (see Next.js multi-zones). */}
          <a href={env.websiteUrl} className="rounded-full px-3 py-2 hover:text-primary">
            JTR website
          </a>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user ? (
            <Link href={user.role === "teacher" ? "/teach" : "/learn"} className="btn-primary ms-1">
              {user.role === "teacher" ? "Teacher dashboard" : "My learning"}
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary ms-1 hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/#courses" className="btn-primary ms-1">
                Enrol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="dark border-t border-line bg-navy text-ink">
      <div className="mx-auto grid max-w-site gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo size={42} />
          <p className="mt-4 text-sm text-muted">
            Live online courses from Jules TechRight. Learn practical AI skills from Jules, with an AI tutor between classes.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-silver uppercase">Academy</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <Link href="/#courses" className="hover:text-primary">
                Courses
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-primary">
                Student login
              </Link>
            </li>
            <li>
              <Link href="/verify" className="hover:text-primary">
                Verify a certificate
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-silver uppercase">Jules TechRight</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <a href={env.websiteUrl} className="hover:text-primary">
                Website
              </a>
            </li>
            <li>
              <a href={`${env.websiteUrl}/contact`} className="hover:text-primary">
                Contact
              </a>
            </li>
            <li>
              <a href={`${env.websiteUrl}/privacy`} className="hover:text-primary">
                Privacy
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-site px-4 py-5 text-xs text-muted sm:px-6">© {year} Jules TechRight (JTR) Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
}
