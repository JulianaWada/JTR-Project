import { Readex_Pro, IBM_Plex_Sans } from "next/font/google";

// Declared once and shared by the site and admin layouts, so each Google font is loaded from one place.

// Readex Pro for headings. Only the Latin file is preloaded here (French and Portuguese accents are in it);
// the Arabic file is self-hosted in /public/fonts and preloaded on Arabic pages only.
export const headingFont = Readex_Pro({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

// IBM Plex Sans for Latin body text. IBM Plex Sans Arabic is self-hosted in /public/fonts (see globals.css)
// so Arabic pages can preload it without slowing down the other languages.
export const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});
