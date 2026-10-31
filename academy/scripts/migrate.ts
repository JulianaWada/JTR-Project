import { migratePostgres } from "@/lib/db";

// Runs before every production build. Without DATABASE_URL the embedded database migrates itself on start.
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.info("[migrate] DATABASE_URL not set; skipping (the embedded demo database migrates on start).");
} else {
  const problem = checkUrl(url);
  if (problem) fail(problem);
  try {
    await migratePostgres(url);
    console.info("[migrate] database is up to date.");
  } catch (err) {
    fail(explain(err));
  }
}

/** Catches the usual copy-paste mistakes before trying to connect. */
function checkUrl(value: string): string | null {
  if (/^["']|["']$/.test(value)) return "DATABASE_URL is wrapped in quotes. Paste it without the quotes.";
  if (value.includes("[YOUR-PASSWORD]")) return "DATABASE_URL still contains [YOUR-PASSWORD]. Replace it (brackets included) with your Supabase database password.";
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "DATABASE_URL is not a valid connection string. If your password contains @, #, / or ?, reset it in Supabase to one with only letters and numbers.";
  }
  if (!/^postgres(ql)?:$/.test(parsed.protocol)) return "DATABASE_URL must start with postgresql://";
  if (/^db\.[^.]+\.supabase\.co$/.test(parsed.hostname)) {
    return "DATABASE_URL uses Supabase's direct connection (db.….supabase.co), which Vercel can't reach. In Supabase, click Connect, choose Transaction pooler (port 6543) and copy that string instead.";
  }
  return null;
}

function explain(err: unknown): string {
  const cause = (err as { cause?: { code?: string; message?: string } })?.cause ?? (err as { code?: string; message?: string });
  const code = cause?.code ?? "";
  const message = cause?.message ?? String(err);
  if (code === "ENOTFOUND") return `The database address in DATABASE_URL wasn't found (${message}). Copy the Transaction pooler string from Supabase again.`;
  if (code === "28P01" || /password authentication failed/i.test(message)) return "Supabase rejected the password in DATABASE_URL. Reset the database password in Supabase (Project settings > Database) and paste the new one into the string.";
  if (/tenant or user not found/i.test(message)) return "Supabase doesn't recognise the user in DATABASE_URL. The user must look like postgres.<project-id>; copy the Transaction pooler string again.";
  if (code === "ETIMEDOUT" || code === "ECONNREFUSED" || code === "ENETUNREACH") return `Couldn't connect to the database (${code}). Use the Transaction pooler string (port 6543), and check the Supabase project isn't paused.`;
  return `Couldn't update the database: ${message}`;
}

function fail(reason: string): never {
  console.error(`[migrate] ${reason}`);
  process.exit(1);
}
