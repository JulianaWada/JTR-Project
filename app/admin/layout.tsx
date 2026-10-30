import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Readex_Pro, IBM_Plex_Sans } from "next/font/google";
import { cn } from "@/lib/cn";
import "../globals.css";

// The admin board is for Jules only: English, outside the language routes, never indexed.

const heading = Readex_Pro({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "JTR Admin", template: "%s · JTR Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(heading.variable, body.variable, "antialiased")}>
      <body className="min-h-screen bg-bg">{children}</body>
    </html>
  );
}
