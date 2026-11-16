import { z } from "zod";
import { locales } from "@/i18n/routing";

// Shared rules for the website account forms (sign up, sign in, profile). Error messages are keys into
// messages/*.json under account.errors, so they show in the visitor's language.

/** What members can ask to hear about. Labels live in messages/*.json under account.interests. */
export const memberInterests = ["websites", "apps", "ai", "academy", "news"] as const;
export type MemberInterest = (typeof memberInterests)[number];

export const PASSWORD_MIN = 8;

const email = z.string().trim().toLowerCase().min(1, "required").max(200, "tooLong").email("email");
const password = z.string().min(PASSWORD_MIN, "passwordShort").max(200, "tooLong");
const name = z.string().trim().min(1, "required").max(120, "tooLong");
const phone = z
  .string()
  .trim()
  .max(30, "tooLong")
  .regex(/^\+?[\d\s()-]{6,}$/, "phone")
  .optional()
  .or(z.literal("").transform(() => undefined));
const interests = z.array(z.enum(memberInterests)).max(memberInterests.length).default([]);
const utm = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => v || undefined);

export const signupSchema = z
  .object({
    name,
    email,
    password,
    phone,
    interests,
    marketingEmail: z.boolean(),
    marketingWhatsapp: z.boolean(),
    locale: z.enum(locales),
    utmSource: utm,
    utmMedium: utm,
    utmCampaign: utm,
  })
  .refine((v) => !v.marketingWhatsapp || Boolean(v.phone), { path: ["phone"], message: "phoneForWhatsapp" });
export type SignupInput = z.input<typeof signupSchema>;

export const loginSchema = z.object({ email, password: z.string().min(1, "required").max(200, "tooLong") });

export const profileSchema = z
  .object({ name, phone, interests, marketingEmail: z.boolean(), marketingWhatsapp: z.boolean() })
  .refine((v) => !v.marketingWhatsapp || Boolean(v.phone), { path: ["phone"], message: "phoneForWhatsapp" });

export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ token: z.string().min(10).max(200), password });
