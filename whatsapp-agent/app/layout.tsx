import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "JTR WhatsApp Agent", template: "%s · JTR WhatsApp Agent" },
  description: "An AI sales assistant that answers customers, takes orders and bookings, and collects payments on WhatsApp.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
