// Turns a database connection error into a plain sentence that is safe to show on the admin login page and in the
// Vercel logs. It never includes the connection string, the password or the host name.

type ErrorLike = { name?: string; code?: string; message?: string; cause?: unknown };

function rootCause(err: unknown): ErrorLike {
  let current = err as ErrorLike | undefined;
  // Drizzle wraps the driver's error in `cause` ("Failed query: ..."), sometimes more than once.
  for (let i = 0; i < 5 && current?.cause; i++) current = current.cause as ErrorLike;
  return current ?? {};
}

export function describeDbError(err: unknown): string {
  // Already explained by getDb().
  const known = (err as { dbReason?: unknown } | null)?.dbReason;
  if (typeof known === "string") return known;
  const cause = rootCause(err);
  const code = String(cause.code ?? "");
  const message = String(cause.message ?? "");

  if (code === "ERR_INVALID_URL" || /invalid url/i.test(message)) {
    return "DATABASE_URL is not a valid connection string. This usually means the password has symbols such as # @ / ? or %, or the [YOUR-PASSWORD] brackets were left in. Reset the database password in Supabase to letters and numbers only, paste the new password in place of [YOUR-PASSWORD] (no brackets), save it in Vercel and redeploy.";
  }
  if (code === "28P01" || /password authentication failed/i.test(message)) {
    return "The database rejected the password in DATABASE_URL. Check that it is the database password of this Supabase project (not your Supabase login) and that the [YOUR-PASSWORD] brackets are gone, then redeploy.";
  }
  if (/tenant or user not found/i.test(message)) {
    return "Supabase does not recognise the user name in DATABASE_URL. For the pooler it must look like postgres.<project id>. Copy the connection string again from Supabase (Connect > Transaction pooler), then redeploy.";
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return "The database address in DATABASE_URL was not found. Use the Transaction pooler string from Supabase (it ends in pooler.supabase.com:6543), not the Direct connection one, then redeploy.";
  }
  if (code === "ENETUNREACH" || code === "EHOSTUNREACH") {
    return "The database cannot be reached from Vercel. The Direct connection in Supabase only works over IPv6; use the Transaction pooler string (pooler.supabase.com:6543) instead, then redeploy.";
  }
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "CONNECT_TIMEOUT" || code === "ECONNRESET") {
    return "The database did not answer. Check that the Supabase project is not paused and that DATABASE_URL uses the Transaction pooler (port 6543).";
  }
  if (code === "57014" || /statement timeout/i.test(message)) {
    return "The database took too long to answer (statement timeout). Most likely an earlier stuck session is still holding a lock. In Supabase, open Project Settings > General and click Restart project, wait for it to come back, then redeploy on Vercel.";
  }
  if (code === "55P03" || /lock timeout/i.test(message)) {
    return "The database is locked by another session. In Supabase, open Project Settings > General and click Restart project, then redeploy on Vercel.";
  }
  if (code === "42P01") {
    return "The website's tables have not been created in this database yet. Redeploy on Vercel: each deploy sets up the tables before the site starts.";
  }
  if (code === "3D000") {
    return "The database named at the end of DATABASE_URL does not exist. It should end in /postgres.";
  }
  if (code === "42501") {
    return "The database user in DATABASE_URL is not allowed to create the website's tables. Use the postgres user from Supabase's connection string.";
  }
  return `The database returned an error${code ? ` (code ${code})` : ""}. Check DATABASE_URL in Vercel, or share the Vercel runtime log for this request.`;
}
