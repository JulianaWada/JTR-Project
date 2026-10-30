import { migratePostgres } from "@/lib/db";

// Runs before every production build. Without DATABASE_URL the embedded database migrates itself on start.
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.info("[migrate] DATABASE_URL not set; skipping (the embedded demo database migrates on start).");
} else {
  await migratePostgres(url);
  console.info("[migrate] database is up to date.");
}
