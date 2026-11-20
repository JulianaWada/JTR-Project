import "server-only";
import postgres from "postgres";

// Read connections to the other JTR apps' databases. Each app owns its own schema and migrations;
// the admin board only runs the queries in the files next to this one.

type Pool = { sql: postgres.Sql; lastUsed: number };
const globalForPg = globalThis as unknown as { __jtrAdminPools?: Map<string, Pool> };

// Replaced after a quiet spell: Vercel freezes the server between visits, and connections left from before can hang
// (same as the website's own database, see lib/db/index.ts).
const IDLE_REFRESH_MS = 15_000;

export function connect(url: string): postgres.Sql {
  globalForPg.__jtrAdminPools ??= new Map();
  const now = Date.now();
  let pool = globalForPg.__jtrAdminPools.get(url);
  if (pool && now - pool.lastUsed > IDLE_REFRESH_MS) {
    pool.sql.end({ timeout: 5 }).catch(() => {});
    pool = undefined;
  }
  if (!pool) {
    // `prepare: false` keeps it compatible with Supabase's transaction pooler (port 6543).
    // Short timeouts: an unreachable app database shows "not connected" on the board instead of holding the page.
    pool = { sql: postgres(url, { prepare: false, max: 2, idle_timeout: 20, max_lifetime: 60 * 5, connect_timeout: 5, onnotice: () => {} }), lastUsed: now };
    globalForPg.__jtrAdminPools.set(url, pool);
  }
  pool.lastUsed = now;
  return pool.sql;
}

export function envUrl(name: string) {
  return process.env[name]?.trim() || undefined;
}

/** "off" until the app's database URL is set: the board then shows a "not connected" notice, never made-up data. */
export type SourceMode = "live" | "off";
