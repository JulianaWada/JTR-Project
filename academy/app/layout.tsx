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
    "Online courses from Jules TechRight: boost your sales with AI and create animation videos with AI. Earn badges and a verified certificate.",
  applicationName: "JTR Academy",
};

export const viewport: Viewport = {
  themeColor: "#f5f7fa",
};

// Opens in light (day) mode by default, like the JTR website. Dark mode only when the
// visitor has switched to it with the toggle ("theme" = "dark" in localStorage).
const themeScript = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

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
