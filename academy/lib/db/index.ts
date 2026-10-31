import { mkdir } from "node:fs/promises";
import path from "node:path";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Both drivers expose the same query API; the type of the embedded one is used throughout.
export type Database = PgliteDatabase<typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

type DbState = { db: Database; ready: Promise<void> };
const globalForDb = globalThis as unknown as { __jtrAcademyDb?: DbState };

async function createPglite(dataDir?: string): Promise<DbState> {
  const { PGlite } = await import("@electric-sql/pglite");
  if (dataDir) await mkdir(dataDir, { recursive: true });
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzlePglite(client, { schema });
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  return { db, ready: migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }) };
}

function createPostgres(url: string): DbState {
  // `prepare: false` keeps it compatible with Supabase's transaction pooler (port 6543).
  const db = drizzlePostgres(postgres(url, { prepare: false, max: 5 }), { schema }) as unknown as Database;
  // Production migrations run at build time (scripts/migrate.ts), not on every cold start.
  return { db, ready: Promise.resolve() };
}

let pending: Promise<DbState> | null = null;

/** The shared database. Uses Postgres when DATABASE_URL is set, otherwise an embedded PGlite on disk. */
export async function getDb(): Promise<Database> {
  if (!globalForDb.__jtrAcademyDb) {
    pending ??= (async () => {
      const state = env.databaseUrl ? createPostgres(env.databaseUrl) : await createPglite(env.pgliteDir);
      await state.ready;
      globalForDb.__jtrAcademyDb = state;
      const { ensureDemoData } = await import("@/lib/seed");
      await ensureDemoData(state.db);
      const { ensureSelfPacedCohorts } = await import("@/lib/self-paced");
      await ensureSelfPacedCohorts(state.db);
      return state;
    })();
    // A failed start (e.g. the database is unreachable) is retried on the next request.
    await pending.catch((err) => {
      pending = null;
      throw err;
    });
  }
  return globalForDb.__jtrAcademyDb!.db;
}

/** Tests: start every file with a fresh in-memory database. */
export async function createInMemoryDb(): Promise<Database> {
  const state = await createPglite();
  await state.ready;
  globalForDb.__jtrAcademyDb = state;
  return state.db;
}

export async function migratePostgres(url: string) {
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const client = postgres(url, { prepare: false, max: 1 });
  await migrate(drizzlePostgres(client, { schema }), { migrationsFolder: MIGRATIONS_FOLDER });
  await client.end();
}

export { schema };
