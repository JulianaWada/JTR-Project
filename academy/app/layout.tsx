import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Readex_Pro } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const heading = Readex_Pro({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: "JTR Academy: live AI courses", template: "%s · JTR Academy" },
  description:
    "Live online courses from Jules TechRight: boost your sales with AI and create animation videos with AI. Earn badges and a verified certificate.",
  applicationName: "JTR Academy",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#07111f" },
  ],
};

// Uses the same saved theme as the JTR website ("theme" in localStorage), so light/dark carries over.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
