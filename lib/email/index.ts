import "server-only";
import type { EmailProvider } from "./types";
import { createResendProvider } from "./resend";
import { consoleProvider } from "./console";

/**
 * Returns the configured email provider.
 * To use another service (Postmark, SES, SendGrid...), add a file next to resend.ts
 * that implements EmailProvider and return it here.
 */
export function getEmailProvider(): EmailProvider {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    // TODO: use an address on your own verified Resend domain.
    const from = process.env.LEADS_FROM_EMAIL ?? "JTR Website <website@julestechright.com>";
    return createResendProvider(key, from);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("RESEND_API_KEY is not set");
  }
  return consoleProvider;
}
