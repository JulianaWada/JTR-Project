import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { bodyFont, headingFont } from "@/lib/fonts";
import "../globals.css";

// The admin board is for Jules only: English, outside the language routes, never indexed.

export const metadata: Metadata = {
  title: { default: "JTR Admin", template: "%s · JTR Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(headingFont.variable, bodyFont.variable, "antialiased")}>
      <body className="min-h-screen bg-bg">{children}</body>
    </html>
  );
}
