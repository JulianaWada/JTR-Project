import "server-only";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { describeDbError } from "./diagnose";
import * as schema from "./schema";
import { withTimeout } from "@/lib/with-timeout";

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
  // Tables are created at deploy time (scripts/migrate-site.mjs, run by `npm run build`). Here a cold start only checks,
  // with one quick query, and catches up if the build couldn't. Never more than one runner, never fatal for the page:
  // many instances creating the same tables at once is what left the new Supabase database locked (Nov 2026).
  await withTimeout(catchUpMigrations(url, client), 25_000).catch((err: unknown) => {
    console.error(`[db] Couldn't check the database tables at start: ${describeDbError(err)}`);
  });
  return { db: db as unknown as Database };
}

async function expectedMigrations(): Promise<number> {
  const journal = JSON.parse(await readFile(path.join(MIGRATIONS_FOLDER, "meta", "_journal.json"), "utf8")) as { entries: unknown[] };
  return journal.entries.length;
}

async function catchUpMigrations(url: string, client: postgres.Sql) {
  const expected = await expectedMigrations();
  const [table] = await client<{ exists: boolean }[]>`select to_regclass('drizzle.__jtr_site_migrations') is not null as exists`;
  const applied = table?.exists ? ((await client<{ n: number }[]>`select count(*)::int as n from drizzle.__jtr_site_migrations`)[0]?.n ?? 0) : 0;
  if (applied >= expected) return;
  console.warn(`[db] ${expected - applied} database update(s) missing; applying them now.`);
  const runner = postgres(url, { prepare: false, max: 1, connect_timeout: 10, onnotice: () => {} });
  try {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(drizzlePostgres(runner), MIGRATIONS);
  } finally {
    await runner.end({ timeout: 5 }).catch(() => {});
  }
}

let pending: Promise<DbState> | null = null;

/** The website's database: Postgres when DATABASE_URL is set, otherwise an embedded PGlite (test mode). */
export async function getDb(): Promise<Database> {
  if (!globalForDb.__jtrSiteDb) {
    const url = databaseUrl();
    if (!pending) {
      const started = Date.now();
      console.info("[db] connecting");
      pending = (url ? createPostgres(url) : createPglite()).then((state) => {
        console.info(`[db] ready after ${Date.now() - started} ms`);
        return state;
      });
    }
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
