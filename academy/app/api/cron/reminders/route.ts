import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { sendClassReminders } from "@/lib/reminders";

export const maxDuration = 60;

// Vercel Cron calls this every hour (vercel.json) with "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: Request) {
  const secret = env.cronSecret;
  if (!secret && env.isProduction) return new Response("CRON_SECRET is not set", { status: 503 });
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await sendClassReminders(await getDb());
  return Response.json(result);
}
