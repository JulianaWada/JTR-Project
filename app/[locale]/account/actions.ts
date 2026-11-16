"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  checkMemberLogin,
  createMember,
  createPasswordReset,
  deleteMember,
  endMemberSession,
  getMember,
  resetPassword,
  startMemberSession,
  unsubscribeEmail,
  updateMember,
} from "@/lib/members/auth";
import { sendResetEmail, sendWelcomeEmail } from "@/lib/members/emails";
import { forgotSchema, loginSchema, memberInterests, profileSchema, resetSchema, signupSchema } from "@/lib/members/schema";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

/** What a form gets back. Messages are keys into account.errors in messages/*.json. */
export type FormState = {
  ok?: boolean;
  error?: "invalid" | "exists" | "wrong" | "tooMany" | "server" | "badLink";
  fields?: Record<string, string>;
};

const signupLimit = createRateLimiter({ limit: 5, windowMs: 60 * 60_000 });
const loginLimit = createRateLimiter({ limit: 10, windowMs: 15 * 60_000 });
const forgotLimit = createRateLimiter({ limit: 5, windowMs: 60 * 60_000 });

async function ip() {
  return clientIp(await headers());
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fields[key] ??= issue.message;
  }
  return fields;
}

function str(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

function interestsFrom(form: FormData) {
  return form.getAll("interests").filter((v): v is (typeof memberInterests)[number] => (memberInterests as readonly unknown[]).includes(v));
}

function localeFrom(form: FormData) {
  const l = str(form, "locale");
  return hasLocale(routing.locales, l) ? l : routing.defaultLocale;
}

export async function signupAction(form: FormData): Promise<FormState> {
  // Honeypot: people never see this field, bots tend to fill it in.
  if (str(form, "website")) return { ok: true };
  if (!signupLimit(await ip()).ok) return { error: "tooMany" };

  const parsed = signupSchema.safeParse({
    name: str(form, "name"),
    email: str(form, "email"),
    password: str(form, "password"),
    phone: str(form, "phone"),
    interests: interestsFrom(form),
    marketingEmail: form.get("marketingEmail") === "on",
    marketingWhatsapp: form.get("marketingWhatsapp") === "on",
    locale: localeFrom(form),
    utmSource: str(form, "utmSource"),
    utmMedium: str(form, "utmMedium"),
    utmCampaign: str(form, "utmCampaign"),
  });
  if (!parsed.success) return { error: "invalid", fields: fieldErrors(parsed.error) };

  try {
    const member = await createMember(parsed.data);
    if (!member) return { error: "exists", fields: { email: "exists" } };
    await startMemberSession(member.id);
    await sendWelcomeEmail(member);
    return { ok: true };
  } catch (err) {
    console.error("[members] sign-up failed", err);
    return { error: "server" };
  }
}

export async function loginAction(form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: str(form, "email"), password: str(form, "password") });
  if (!parsed.success) return { error: "invalid", fields: fieldErrors(parsed.error) };
  if (!loginLimit(`${await ip()}:${parsed.data.email}`).ok) return { error: "tooMany" };
  try {
    const member = await checkMemberLogin(parsed.data.email, parsed.data.password);
    if (!member) return { error: "wrong" };
    await startMemberSession(member.id);
    return { ok: true };
  } catch (err) {
    console.error("[members] sign-in failed", err);
    return { error: "server" };
  }
}

export async function logoutAction(): Promise<FormState> {
  await endMemberSession();
  return { ok: true };
}

export async function updateProfileAction(form: FormData): Promise<FormState> {
  const member = await getMember();
  if (!member) return { error: "server" };
  const parsed = profileSchema.safeParse({
    name: str(form, "name"),
    phone: str(form, "phone"),
    interests: interestsFrom(form),
    marketingEmail: form.get("marketingEmail") === "on",
    marketingWhatsapp: form.get("marketingWhatsapp") === "on",
  });
  if (!parsed.success) return { error: "invalid", fields: fieldErrors(parsed.error) };
  try {
    await updateMember(member.id, { ...parsed.data, phone: parsed.data.phone ?? null });
    return { ok: true };
  } catch (err) {
    console.error("[members] profile update failed", err);
    return { error: "server" };
  }
}

export async function deleteAccountAction(): Promise<FormState> {
  const member = await getMember();
  if (!member) return { error: "server" };
  await deleteMember(member.id);
  await endMemberSession();
  return { ok: true };
}

/** Always says the link was sent, so the form can't be used to find out who has an account. */
export async function forgotPasswordAction(form: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse({ email: str(form, "email") });
  if (!parsed.success) return { error: "invalid", fields: fieldErrors(parsed.error) };
  if (!forgotLimit(await ip()).ok) return { error: "tooMany" };
  try {
    const reset = await createPasswordReset(parsed.data.email);
    if (reset) await sendResetEmail(reset.member, reset.token);
  } catch (err) {
    console.error("[members] reset request failed", err);
  }
  return { ok: true };
}

export async function resetPasswordAction(form: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse({ token: str(form, "token"), password: str(form, "password") });
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    return fields.token ? { error: "badLink" } : { error: "invalid", fields };
  }
  try {
    const memberId = await resetPassword(parsed.data.token, parsed.data.password);
    if (!memberId) return { error: "badLink" };
    await startMemberSession(memberId);
    return { ok: true };
  } catch (err) {
    console.error("[members] password reset failed", err);
    return { error: "server" };
  }
}

export async function unsubscribeAction(form: FormData): Promise<FormState> {
  try {
    return (await unsubscribeEmail(str(form, "token"))) ? { ok: true } : { error: "badLink" };
  } catch (err) {
    console.error("[members] unsubscribe failed", err);
    return { error: "server" };
  }
}
