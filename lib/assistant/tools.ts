import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

/** Validated against this schema before use, since streamed tool input is not validated by the API. */
export const saveLeadInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  country: z.string().max(80).optional(),
  company: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  project_summary: z.string().min(10).max(5000),
});

export const saveLeadTool: Anthropic.Beta.BetaTool = {
  name: "save_lead",
  description:
    "Send the visitor's contact details and project summary to the JTR team so they can follow up by email. Only call this after the visitor has provided their name, email and a project summary, and agreed to be contacted.",
  strict: true,
  eager_input_streaming: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string", description: "The visitor's full name, exactly as they gave it." },
      email: { type: "string", description: "The visitor's email address." },
      country: { type: "string", description: "The country the visitor is based in, if they said." },
      company: { type: "string", description: "The visitor's company or organisation, if they said." },
      phone: { type: "string", description: "Phone number with country code, if the visitor gave one." },
      project_summary: { type: "string", description: "A short summary of what the visitor wants to build or needs help with, in their own words." },
    },
    required: ["name", "email", "project_summary"],
  },
};
