"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkLogin, endAdminSession, requireAdmin, startAdminSession } from "@/lib/admin/auth";
import { leadStatuses, saveProjectOrder, saveProjectSettings, setInterestStatus, setLeadStatus } from "@/lib/admin/site-data";
import { addBusiness, type AddBusinessResult } from "@/lib/admin/sources/whatsapp";
import { getAllProjects } from "@/lib/projects";
import { clientIp } from "@/lib/rate-limit";
import { locales } from "@/i18n/routing";

// Counts wrong passwords only, per IP address: 8 tries every 15 minutes.
const failedLogins = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILURES = 8;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ip = clientIp(await headers());
  const now = Date.now();
  let failures = failedLogins.get(ip);
  if (failures && failures.resetAt <= now) failures = undefined;
  if (failures && failures.count >= MAX_FAILURES) {
    return { error: `Too many wrong attempts. Try again in ${Math.ceil((failures.resetAt - now) / 60_000)} minutes.` };
  }
  if (!checkLogin({ email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") })) {
    if (failedLogins.size > 10_000) failedLogins.clear();
    failedLogins.set(ip, { count: (failures?.count ?? 0) + 1, resetAt: failures?.resetAt ?? now + FAILURE_WINDOW_MS });
    return { error: "That email or password is not right." };
  }
  failedLogins.delete(ip);
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}

const statusSchema = z.enum(leadStatuses as [string, ...string[]]);

export async function updateLeadStatus(form: FormData) {
  await requireAdmin();
  const status = statusSchema.parse(form.get("status")) as (typeof leadStatuses)[number];
  await setLeadStatus(String(form.get("id")), status);
  revalidatePath("/admin", "layout");
}

export async function updateInterestStatus(form: FormData) {
  await requireAdmin();
  const status = statusSchema.parse(form.get("status")) as (typeof leadStatuses)[number];
  await setInterestStatus(String(form.get("id")), status);
  revalidatePath("/admin", "layout");
}

/** The public pages that show projects, so changes appear straight away. */
function refreshProjectPages() {
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/projects`);
  }
  revalidatePath("/admin/projects");
}

const projectSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["live", "in-progress"]),
  href: z.union([z.literal(""), z.string().trim().url().max(300)]),
});

export type ProjectState = { ok?: boolean; error?: string };

export async function updateProject(_prev: ProjectState, form: FormData): Promise<ProjectState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse({ id: form.get("id"), status: form.get("status"), href: String(form.get("href") ?? "").trim() });
  if (!parsed.success) return { error: "Use a full link starting with https://, or leave it empty." };
  const known = (await getAllProjects()).some((p) => p.id === parsed.data.id);
  if (!known) return { error: "Unknown project." };
  await saveProjectSettings(parsed.data.id, {
    status: parsed.data.status,
    href: parsed.data.href,
    hidden: form.get("visible") !== "on",
    featured: form.get("featured") === "on",
  });
  refreshProjectPages();
  return { ok: true };
}

export async function moveProject(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const direction = form.get("direction") === "up" ? -1 : 1;
  const ids = (await getAllProjects()).map((p) => p.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await saveProjectOrder(ids);
  refreshProjectPages();
}

const businessSchema = z.object({
  name: z.string().trim().min(2, "Enter the business name.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes for the web address.")
    .max(60),
  kind: z.enum(["salon", "food", "other"]),
  whatsappPhoneNumberId: z.string().trim().regex(/^\d{6,30}$/, "The WhatsApp phone number ID is the long number from Meta's WhatsApp Manager."),
  whatsappDisplayNumber: z.string().trim().max(30).optional(),
  ownerPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => !v || (v.length >= 8 && v.length <= 15), "Enter the owner's WhatsApp number with the country code, e.g. 234 803 000 0000.")
    .optional(),
  address: z.string().trim().max(300).optional(),
});

export type AddBusinessState = { result?: AddBusinessResult; values?: Record<string, string> };

export async function createBusiness(_prev: AddBusinessState, form: FormData): Promise<AddBusinessState> {
  await requireAdmin();
  const values = Object.fromEntries(
    ["name", "slug", "kind", "whatsappPhoneNumberId", "whatsappDisplayNumber", "ownerPhone", "address"].map((k) => [k, String(form.get(k) ?? "")]),
  );
  const parsed = businessSchema.safeParse({
    ...values,
    whatsappDisplayNumber: values.whatsappDisplayNumber || undefined,
    ownerPhone: values.ownerPhone || undefined,
    address: values.address || undefined,
  });
  if (!parsed.success) return { values, result: { ok: false, error: parsed.error.issues[0].message } };
  const result = await addBusiness({ ...parsed.data, ownerPhone: parsed.data.ownerPhone || undefined });
  if (result.ok) revalidatePath("/admin", "layout");
  return { result, values: result.ok ? undefined : values };
}
