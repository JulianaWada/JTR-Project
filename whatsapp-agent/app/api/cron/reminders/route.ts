import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { runReminders } from "@/lib/reminders";

export const maxDuration = 60;

/**
 * Call every 10–15 minutes with "Authorization: Bearer <CRON_SECRET>".
 * Vercel Cron sends that header automatically when CRON_SECRET is set.
 */
export async function GET(request: Request) {
  const secret = env.cronSecret;
  if (!secret) return new Response("CRON_SECRET is not set", { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const summary = await runReminders(await getDb());
  return Response.json(summary);
}
