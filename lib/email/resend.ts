import "server-only";
import { Resend } from "resend";
import type { EmailMessage, EmailProvider } from "./types";

export function createResendProvider(apiKey: string, from: string): EmailProvider {
  const resend = new Resend(apiKey);
  return {
    name: "resend",
    async send(message: EmailMessage) {
      const { error } = await resend.emails.send({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        replyTo: message.replyTo,
      });
      if (error) throw new Error(`Resend: ${error.message}`);
    },
  };
}
