import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { locales } from "@/i18n/routing";

export const academyCourses = ["sales", "animation", "both"] as const;
export const heardFromOptions = ["whatsapp", "instagram", "x", "facebook", "tiktok", "friend", "other"] as const;

/**
 * "Register your interest" form for JTR Academy, used by the form (client + server).
 * Error messages are translation keys under academyInterest.errors.
 */
export const academyInterestSchema = z.object({
  name: z.string().trim().min(1, "required").max(120, "tooLong"),
  phone: z
    .string()
    .trim()
    .min(1, "required")
    .max(40, "tooLong")
    .refine((v) => isValidPhoneNumber(v), "phone"),
  email: z.string().trim().max(200, "tooLong").optional().refine((v) => !v || z.string().email().safeParse(v).success, "email"),
  course: z.enum(academyCourses, { message: "course" }),
  location: z.string().trim().max(120, "tooLong").optional(),
  heardFrom: z.enum(heardFromOptions).optional(),
  locale: z.enum(locales).default("en"),
  consent: z.literal(true, { message: "consent" }),
  /** Honeypot: real visitors never see or fill this field. */
  website: z.string().max(0).optional(),
});

export type AcademyInterestInput = z.input<typeof academyInterestSchema>;
export type AcademyInterest = z.output<typeof academyInterestSchema>;
