import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// JTR Academy is a separate Next.js app (academy/ in this repository) served under /academy on this domain
// (Next.js multi-zones). Set ACADEMY_URL to its deployment, e.g. https://jtr-academy.vercel.app.
const academyUrl = process.env.ACADEMY_URL?.trim().replace(/\/$/, "");

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  env: {
    // Shows the Academy link in the menus only once the academy is connected.
    NEXT_PUBLIC_ACADEMY_ENABLED: academyUrl ? "1" : "",
  },
  async rewrites() {
    if (!academyUrl) return [];
    return [
      { source: "/academy", destination: `${academyUrl}/academy` },
      // /academy/interest stays on this site (the register-interest page printed on invite cards).
      { source: "/academy/:path((?!interest(?:/|$)).*)", destination: `${academyUrl}/academy/:path` },
    ];
  },
  poweredByHeader: false,
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
