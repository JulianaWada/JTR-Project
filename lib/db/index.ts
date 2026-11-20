import "server-only";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { describeDbError } from "./diagnose";
import * as schema from "./schema";

// Both drivers expose the same query API; the type of the embedded one is used throughout.
export type Database = PgliteDatabase<typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");
// Its own migrations table, so the website can share a Postgres database (e.g. the academy's Supabase) safely.
const MIGRATIONS = { migrationsFolder: MIGRATIONS_FOLDER, migrationsTable: "__jtr_site_migrations" };

type DbState = { db: Database };
const globalForDb = globalThis as unknown as { __jtrSiteDb?: DbState };

/** DATABASE_URL without stray spaces or the quotes that sometimes come along when it is pasted into Vercel. */
function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim().replace(/^(["'])(.*)\1$/, "$2").trim() || undefined;
}

export function databaseMode(): "postgres" | "pglite" {
  return databaseUrl() ? "postgres" : "pglite";
}

/** Where the embedded test database lives. Vercel only allows writes to /tmp, which is reset now and then. */
function pgliteDir() {
  return process.env.PGLITE_DIR?.trim() || (process.env.VERCEL ? "/tmp/jtr-site-pglite" : ".data/pglite");
}

async function createPglite(): Promise<DbState> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = pgliteDir();
  await mkdir(dir, { recursive: true });
  const db = drizzlePglite(new PGlite(dir), { schema });
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  await migrate(db, MIGRATIONS);
  return { db };
}

async function createPostgres(url: string): Promise<DbState> {
  // `prepare: false` keeps it compatible with Supabase's transaction pooler (port 6543).
  // Short timeouts so a stale or unreachable connection fails fast instead of hanging a page (same as the academy).
  const client = postgres(url, {
    prepare: false,
    max: 3,
    idle_timeout: 20,
    max_lifetime: 60 * 5,
    connect_timeout: 10,
    onnotice: () => {},
  });
  const db = drizzlePostgres(client, { schema });
  // Migrations are small and idempotent, so they run on the first connection rather than in a separate step.
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  await migrate(db, MIGRATIONS);
  return { db: db as unknown as Database };
}

let pending: Promise<DbState> | null = null;

/** The website's database: Postgres when DATABASE_URL is set, otherwise an embedded PGlite (test mode). */
export async function getDb(): Promise<Database> {
  if (!globalForDb.__jtrSiteDb) {
    const url = databaseUrl();
    pending ??= url ? createPostgres(url) : createPglite();
    // A failed start (e.g. the database is unreachable) is retried on the next request.
    globalForDb.__jtrSiteDb = await pending.catch((err) => {
      pending = null;
      // A plain reason in the Vercel logs. The error object itself is not logged: for a malformed DATABASE_URL it
      // carries the whole connection string, password included.
      const reason = describeDbError(err);
      console.error(`[db] Could not start the database: ${reason}`);
      // Rethrown without the original error for the same reason, so a page that fails doesn't log it either.
      throw Object.assign(new Error(`Database unavailable. ${reason}`), { dbReason: reason });
    });
  }
  return globalForDb.__jtrSiteDb.db;
}

/** Whether the database can be used right now, with a plain reason when it can't (shown on the admin login page). */
export async function checkDatabase(): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await getDb();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: describeDbError(err) };
  }
}

export { describeDbError, schema };
