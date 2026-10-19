import type { ReactNode } from "react";
import "./globals.css";

// The real root layout lives in app/[locale]/layout.tsx so <html lang dir>
// can follow the active language. This file only exists so that
// app/not-found.tsx has a layout to render into.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
