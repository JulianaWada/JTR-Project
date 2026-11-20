// Brings the website's database up to date before each build (run by `npm run build`).
// Doing this once per deploy, on one connection, avoids many serverless instances racing to create the same tables
// at their first visit, which left a fresh Supabase database locked and every page timing out.
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL?.trim().replace(/^(["'])(.*)\1$/, "$2").trim();
if (!url) {
  console.info("[migrate] DATABASE_URL not set; skipping (the built-in test database sets itself up on start).");
  process.exit(0);
}

let client;
try {
  client = postgres(url, { prepare: false, max: 1, connect_timeout: 15, onnotice: () => {} });
  // Give up rather than wait forever behind a lock left by a stuck session.
  const timer = setTimeout(() => {
    console.error(
      "[migrate] The database didn't finish setting up within 2 minutes; another session is probably holding a lock. " +
        "In Supabase, go to Project Settings > General and click Restart project, then redeploy.",
    );
    process.exit(1);
  }, 120_000);
  await migrate(drizzle(client), {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
    migrationsTable: "__jtr_site_migrations",
  });
  clearTimeout(timer);
  console.info("[migrate] website database is up to date.");
  await client.end();
} catch (err) {
  const cause = err?.cause ?? err;
  // Never print the connection string (a malformed one is echoed back in Node's "Invalid URL" error).
  console.error(`[migrate] Couldn't update the database: ${cause?.code ? `code ${cause.code}, ` : ""}${cause?.code === "ERR_INVALID_URL" ? "DATABASE_URL is not a valid connection string" : cause?.message}`);
  process.exit(1);
}
