import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { budgetRanges, currencies, serviceIds } from "@/content/site";
import { locales } from "@/i18n/routing";

/**
 * One schema for every lead, used by the contact form (client + server) and the AI assistant.
 * Error messages are translation keys under contact.form.errors.
 */
export const leadSchema = z.object({
  source: z.enum(["contact-form", "assistant"]).default("contact-form"),
  name: z.string().trim().min(1, "required").max(120, "tooLong"),
  email: z.string().trim().min(1, "required").email("email").max(200, "tooLong"),
  phone: z
    .string()
    .trim()
    .max(40, "tooLong")
    .optional()
    .refine((v) => !v || isValidPhoneNumber(v), "phone"),
  company: z.string().trim().max(160, "tooLong").optional(),
  country: z.string().trim().max(2).optional(),
  timezone: z.string().trim().max(64).optional(),
  service: z.enum([...serviceIds, "other"]).optional(),
  budget: z.enum(budgetRanges).optional(),
  currency: z.enum(currencies).optional(),
  message: z.string().trim().min(10, "tooShort").max(5000, "tooLong"),
  locale: z.enum(locales).default("en"),
  consent: z.boolean().optional(),
  /** Honeypot: real visitors never see or fill this field. */
  website: z.string().max(0).optional(),
}).superRefine((lead, ctx) => {
  // People filling in the contact form must tick the consent box.
  if (lead.source === "contact-form" && lead.consent !== true) {
    ctx.addIssue({ code: "custom", path: ["consent"], message: "consent" });
  }
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;
