import type { EmailMessage, EmailProvider } from "./types";

/** Development fallback: prints emails to the server log instead of sending them. */
export const consoleProvider: EmailProvider = {
  name: "console",
  async send(message: EmailMessage) {
    console.info(`[email:console] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`);
  },
};
