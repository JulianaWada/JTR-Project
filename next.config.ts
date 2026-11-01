import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// JTR Academy is a separate Next.js app (academy/ in this repository). Two ways to connect it:
// - ACADEMY_PUBLIC_URL (e.g. https://academy.jtechright.com): the academy has its own subdomain. The menu links
//   there and old /academy links on this site redirect to it.
// - ACADEMY_URL only (e.g. https://academy-six-mu.vercel.app): the academy is served under /academy on this site
//   (Next.js multi-zones).
// Either way /academy/interest stays a page of this site (the register-interest page printed on invite cards).
const academyUrl = process.env.ACADEMY_URL?.trim().replace(/\/$/, "");
const academyPublicUrl = process.env.ACADEMY_PUBLIC_URL?.trim().replace(/\/$/, "");
const notInterest = "(?!interest(?:/|$)).*";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  env: {
    // Shows the Academy link in the menus only once the academy is connected.
    NEXT_PUBLIC_ACADEMY_ENABLED: academyUrl || academyPublicUrl ? "1" : "",
    NEXT_PUBLIC_ACADEMY_HREF: academyPublicUrl ? `${academyPublicUrl}/academy` : "/academy",
  },
  async redirects() {
    if (!academyPublicUrl) return [];
    return [
      { source: "/academy", destination: `${academyPublicUrl}/academy`, permanent: false },
      { source: `/academy/:path(${notInterest})`, destination: `${academyPublicUrl}/academy/:path`, permanent: false },
    ];
  },
  async rewrites() {
    if (!academyUrl || academyPublicUrl) return [];
    return [
      { source: "/academy", destination: `${academyUrl}/academy` },
      { source: `/academy/:path(${notInterest})`, destination: `${academyUrl}/academy/:path` },
    ];
  },
  // PGlite (the embedded Postgres used in test mode) ships WASM files that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: { "/**": ["./drizzle/**"] },
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
