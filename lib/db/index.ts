import "server-only";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Both drivers expose the same query API; the type of the embedded one is used throughout.
export type Database = PgliteDatabase<typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");
// Its own migrations table, so the website can share a Postgres database (e.g. the academy's Supabase) safely.
const MIGRATIONS = { migrationsFolder: MIGRATIONS_FOLDER, migrationsTable: "__jtr_site_migrations" };

type DbState = { db: Database };
const globalForDb = globalThis as unknown as { __jtrSiteDb?: DbState };

export function databaseMode(): "postgres" | "pglite" {
  return process.env.DATABASE_URL?.trim() ? "postgres" : "pglite";
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
  const client = postgres(url, { prepare: false, max: 3 });
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
    const url = process.env.DATABASE_URL?.trim();
    pending ??= url ? createPostgres(url) : createPglite();
    // A failed start (e.g. the database is unreachable) is retried on the next request.
    globalForDb.__jtrSiteDb = await pending.catch((err) => {
      pending = null;
      throw err;
    });
  }
  return globalForDb.__jtrSiteDb.db;
}

export { schema };
