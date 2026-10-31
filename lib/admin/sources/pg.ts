import "server-only";
import postgres from "postgres";

// Read connections to the other JTR apps' databases. Each app owns its own schema and migrations;
// the admin board only runs the queries in the files next to this one.

const globalForPg = globalThis as unknown as { __jtrAdminPg?: Map<string, postgres.Sql> };

export function connect(url: string): postgres.Sql {
  globalForPg.__jtrAdminPg ??= new Map();
  let sql = globalForPg.__jtrAdminPg.get(url);
  if (!sql) {
    // `prepare: false` keeps it compatible with Supabase's transaction pooler (port 6543).
    sql = postgres(url, { prepare: false, max: 2, idle_timeout: 20 });
    globalForPg.__jtrAdminPg.set(url, sql);
  }
  return sql;
}

export function envUrl(name: string) {
  return process.env[name]?.trim() || undefined;
}

/** "off" until the app's database URL is set: the board then shows a "not connected" notice, never made-up data. */
export type SourceMode = "live" | "off";
