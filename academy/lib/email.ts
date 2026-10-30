import { Resend } from "resend";
import type { Database } from "@/lib/db";
import { emails } from "@/lib/db/schema";
import { env } from "@/lib/env";

let resend: Resend | null = null;

/**
 * Sends a plain-text email and keeps a copy. Without RESEND_API_KEY nothing leaves the server:
 * the teacher dashboard's Outbox shows what would have been sent.
 */
export async function sendEmail(db: Database, message: { to: string; subject: string; body: string }) {
  const mode = env.resendApiKey ? "live" : "test";
  let error: string | null = null;
  if (mode === "live") {
    try {
      resend ??= new Resend(env.resendApiKey);
      const result = await resend.emails.send({ from: env.emailFrom, to: message.to, subject: message.subject, text: message.body });
      if (result.error) error = result.error.message;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    if (error) console.error("[email] send failed", message.to, error);
  }
  await db.insert(emails).values({ ...message, mode, error });
}
