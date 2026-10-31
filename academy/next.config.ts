import type { NextConfig } from "next";

// Origins that forward /academy to this app (the JTR website), so form submissions from there are accepted.
const forwardedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""))
  .filter(Boolean);

const nextConfig: NextConfig = {
  // The academy lives at /academy, on its own domain or behind the JTR website (Next.js multi-zones).
  basePath: "/academy",
  poweredByHeader: false,
  devIndicators: false,
  // PGlite (the embedded Postgres used for local demos and tests) ships WASM files that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  // This app lives in a folder of the website's repository; keep Next from treating the repo root as the project.
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,
  outputFileTracingIncludes: { "/**": ["./drizzle/**", "./public/brand/**"] },
  // Visiting the academy's own address without /academy would otherwise be a 404.
  async redirects() {
    return [{ source: "/", destination: "/academy", basePath: false, permanent: false }];
  },
  experimental: {
    serverActions: { allowedOrigins: ["jtr-project.vercel.app", "julestechright.com", "www.julestechright.com", ...forwardedOrigins] },
  },
};

export default nextConfig;
