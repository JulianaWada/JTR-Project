import "server-only";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/content/site";
import { getEmailProvider } from "@/lib/email";
import { localeUrl } from "@/lib/seo";

// Emails to website members. Sending never blocks sign-up: when RESEND_API_KEY is not set yet they are skipped
// (and printed to the server log outside production).

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(paragraphs: string[], button?: { label: string; href: string }, footer?: string) {
  const p = (text: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#13233d">${escapeHtml(text)}</p>`;
  const btn = button
    ? `<p style="margin:24px 0"><a href="${button.href}" style="background:#1563d6;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:15px">${escapeHtml(button.label)}</a></p>`
    : "";
  const foot = footer ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#6b7a90">${footer}</p>` : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px">${paragraphs.map(p).join("")}${btn}${foot}</div>`;
}

export function unsubscribeUrl(locale: string, token: string) {
  return `${localeUrl(locale, "/unsubscribe")}?token=${encodeURIComponent(token)}`;
}

async function send(message: Parameters<ReturnType<typeof getEmailProvider>["send"]>[0]) {
  try {
    await getEmailProvider().send(message);
    return true;
  } catch (err) {
    console.error("[members] email not sent", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendWelcomeEmail(member: { name: string; email: string; locale: string; marketingEmail: boolean; unsubscribeToken: string }) {
  const t = await getTranslations({ locale: member.locale, namespace: "account.emails" });
  const first = member.name.split(" ")[0];
  const account = localeUrl(member.locale, "/account");
  const lines = [t("hello", { name: first }), t("welcomeBody"), member.marketingEmail ? t("welcomeOptedIn") : t("welcomeNotOptedIn")];
  const unsubscribe = member.marketingEmail ? unsubscribeUrl(member.locale, member.unsubscribeToken) : undefined;
  const footer = unsubscribe ? `${escapeHtml(t("footer"))} <a href="${unsubscribe}" style="color:#6b7a90">${escapeHtml(t("unsubscribe"))}</a>` : escapeHtml(t("footer"));
  return send({
    to: member.email,
    replyTo: siteConfig.contact.email,
    subject: t("welcomeSubject"),
    text: `${lines.join("\n\n")}\n\n${t("openAccount")}: ${account}${unsubscribe ? `\n\n${t("unsubscribe")}: ${unsubscribe}` : ""}`,
    html: layout(lines, { label: t("openAccount"), href: account }, footer),
  });
}

export async function sendResetEmail(member: { name: string; email: string; locale: string }, token: string) {
  const t = await getTranslations({ locale: member.locale, namespace: "account.emails" });
  const link = `${localeUrl(member.locale, "/account/reset")}?token=${encodeURIComponent(token)}`;
  const lines = [t("hello", { name: member.name.split(" ")[0] }), t("resetBody"), t("resetIgnore")];
  return send({
    to: member.email,
    subject: t("resetSubject"),
    text: `${lines.join("\n\n")}\n\n${t("resetButton")}: ${link}`,
    html: layout(lines, { label: t("resetButton"), href: link }, escapeHtml(t("footer"))),
  });
}
