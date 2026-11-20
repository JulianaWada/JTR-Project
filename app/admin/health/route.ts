import { sql } from "drizzle-orm";
import { teamSize } from "@/lib/admin/auth";
import { siteCounts } from "@/lib/admin/site-data";
import { academyMode, listCourses } from "@/lib/admin/sources/academy";
import { listBusinesses, whatsappMode } from "@/lib/admin/sources/whatsapp";
import { databaseMode, describeDbError, getDb } from "@/lib/db";
import { withTimeout } from "@/lib/with-timeout";

// A plain-text check of each step the admin board needs, with how long it took. Open /admin/health in a browser.
// It shows no data, no addresses and no secrets: only "ok" or a plain reason per step.

export const dynamic = "force-dynamic";

async function step(name: string, run: () => Promise<unknown>, ms = 15_000, envName = "DATABASE_URL") {
  const started = Date.now();
  try {
    await withTimeout(run(), ms);
    return `ok      ${name} (${Date.now() - started} ms)`;
  } catch (err) {
    return `FAILED  ${name} after ${Date.now() - started} ms: ${describeDbError(err).replace(/\bDATABASE_URL\b/g, envName)}`;
  }
}

export async function GET() {
  const lines = [`JTR admin health check, ${new Date().toISOString()}`, `Database: ${databaseMode() === "postgres" ? "DATABASE_URL" : "built-in test database"}`, ""];
  lines.push(await step("connect to the website database", () => getDb(), 30_000));
  lines.push(await step("simple query", async () => (await getDb()).execute(sql`select 1`)));
  lines.push(await step("read leads and sign-ups", () => siteCounts()));
  lines.push(await step("read team logins", () => teamSize()));
  if (academyMode() === "live") lines.push(await step("read the academy database", () => listCourses(), 10_000, "ACADEMY_DATABASE_URL"));
  if (whatsappMode() === "live") lines.push(await step("read the WhatsApp agent database", () => listBusinesses(), 10_000, "WHATSAPP_AGENT_DATABASE_URL"));
  return new Response(lines.join("\n") + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
