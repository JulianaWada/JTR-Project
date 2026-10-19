export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

/** Swap email providers by implementing this interface (see lib/email/index.ts). */
export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<void>;
}
