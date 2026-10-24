import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // PGlite (the embedded Postgres used for local demos and tests) ships WASM files that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  // This app lives in a folder of the website's repository; keep Next from treating the repo root as the project.
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
