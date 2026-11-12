"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  adminEmail,
  checkLogin,
  endAdminSession,
  generatePassword,
  getAdminSession,
  requireAdmin,
  startAdminSession,
  verifyPassword,
  type AdminSession,
} from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { assignableRoles, can, roleInfo, type Permission } from "@/lib/admin/roles";
import { addTeamMember, changeOwnPassword, getTeamMember, updateTeamMember } from "@/lib/admin/team";
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
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const result = await checkLogin({ email, password: String(form.get("password") ?? "") });
  if (!result.ok) {
    if (failedLogins.size > 10_000) failedLogins.clear();
    failedLogins.set(ip, { count: (failures?.count ?? 0) + 1, resetAt: failures?.resetAt ?? now + FAILURE_WINDOW_MS });
    // The email typed is kept so the super admin can spot someone guessing; the password never is.
    await recordAudit({ userId: null, name: email || "(no email)", email: email || null, role: "unknown" }, "login.failed", null, {
      reason: result.reason,
    });
    if (result.reason === "disabled") return { error: "This login has been turned off. Ask the super admin." };
    return { error: "That email or password is not right." };
  }
  failedLogins.delete(ip);
  await startAdminSession(result.session.id, result.version);
  await recordAudit(result.session, "login.success");
  redirect("/admin");
}

export async function logout() {
  const session = await getAdminSession();
  if (session) await recordAudit(session, "logout");
  await endAdminSession();
  redirect("/admin/login");
}

/** Signed in and allowed. A refusal is written to the audit trail; the pages hide controls a role can't use. */
async function allowed(permission: Permission, what: string): Promise<AdminSession | null> {
  const session = await requireAdmin();
  if (can(session.role, permission)) return session;
  await recordAudit(session, "permission.denied", what, { permission });
  return null;
}

const NOT_ALLOWED = "Your role doesn't allow this. Ask the super admin if you need it.";
const idSchema = z.uuid();

const statusSchema = z.enum(leadStatuses as [string, ...string[]]);

export async function updateLeadStatus(form: FormData) {
  const session = await allowed("leads.update", "Lead status");
  if (!session) return;
  const status = statusSchema.parse(form.get("status")) as (typeof leadStatuses)[number];
  const id = idSchema.parse(form.get("id"));
  const before = await setLeadStatus(id, status);
  if (before && before.status !== status) await recordAudit(session, "lead.status", before.name, { id, from: before.status, to: status });
  revalidatePath("/admin", "layout");
}

export async function updateInterestStatus(form: FormData) {
  const session = await allowed("leads.update", "Academy sign-up status");
  if (!session) return;
  const status = statusSchema.parse(form.get("status")) as (typeof leadStatuses)[number];
  const id = idSchema.parse(form.get("id"));
  const before = await setInterestStatus(id, status);
  if (before && before.status !== status) await recordAudit(session, "interest.status", before.name, { id, from: before.status, to: status });
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
  const session = await allowed("projects.edit", String(form.get("id") ?? "Project"));
  if (!session) return { error: NOT_ALLOWED };
  const parsed = projectSchema.safeParse({ id: form.get("id"), status: form.get("status"), href: String(form.get("href") ?? "").trim() });
  if (!parsed.success) return { error: "Use a full link starting with https://, or leave it empty." };
  const known = (await getAllProjects()).some((p) => p.id === parsed.data.id);
  if (!known) return { error: "Unknown project." };
  const settings = {
    status: parsed.data.status,
    href: parsed.data.href,
    hidden: form.get("visible") !== "on",
    featured: form.get("featured") === "on",
  };
  await saveProjectSettings(parsed.data.id, settings);
  await recordAudit(session, "project.update", parsed.data.id, settings);
  refreshProjectPages();
  return { ok: true };
}

export async function moveProject(form: FormData) {
  const session = await allowed("projects.edit", String(form.get("id") ?? "Project"));
  if (!session) return;
  const id = String(form.get("id"));
  const direction = form.get("direction") === "up" ? -1 : 1;
  const ids = (await getAllProjects()).map((p) => p.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await saveProjectOrder(ids);
  await recordAudit(session, "project.move", id, { direction: direction === -1 ? "up" : "down", position: to + 1 });
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
  const session = await allowed("whatsapp.add", String(form.get("name") ?? "WhatsApp business"));
  if (!session) return { result: { ok: false, error: NOT_ALLOWED } };
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
  if (result.ok) {
    await recordAudit(session, "whatsapp.business_added", parsed.data.name, { slug: result.slug, kind: parsed.data.kind });
    revalidatePath("/admin", "layout");
  }
  return { result, values: result.ok ? undefined : values };
}

// ---------- Team (super admin only) ----------

const memberSchema = z.object({
  name: z.string().trim().min(2, "Enter their name.").max(80),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email("Enter a valid email address.")),
  role: z.enum(assignableRoles as [string, ...string[]], "Pick a role."),
});

export type TeamState = { error?: string; created?: { name: string; email: string; password: string } };

export async function addMember(_prev: TeamState, form: FormData): Promise<TeamState> {
  const session = await allowed("team.manage", "Add team member");
  if (!session) return { error: NOT_ALLOWED };
  const parsed = memberSchema.safeParse({ name: form.get("name"), email: String(form.get("email") ?? ""), role: form.get("role") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email } = parsed.data;
  const role = parsed.data.role as (typeof assignableRoles)[number];
  if (email === adminEmail()) return { error: "That is the super admin's email. Use a different one." };
  const password = generatePassword();
  const row = await addTeamMember({ name, email, role, password });
  if (!row) return { error: "Someone with that email is already on the team." };
  await recordAudit(session, "team.added", `${name} (${email})`, { role });
  revalidatePath("/admin/team");
  return { created: { name, email, password } };
}

export type MemberState = { error?: string; ok?: string; password?: string };

export async function changeMember(_prev: MemberState, form: FormData): Promise<MemberState> {
  const session = await allowed("team.manage", "Change team member");
  if (!session) return { error: NOT_ALLOWED };
  const id = idSchema.safeParse(form.get("id"));
  const member = id.success ? await getTeamMember(id.data) : undefined;
  if (!member) return { error: "That person is no longer on the team." };
  const who = `${member.name} (${member.email})`;
  const intent = String(form.get("intent"));

  if (intent === "role") {
    const role = z.enum(assignableRoles as [string, ...string[]]).safeParse(form.get("role"));
    if (!role.success) return { error: "Pick a role." };
    const next = role.data as (typeof assignableRoles)[number];
    if (next === member.role) return {};
    await updateTeamMember(member.id, { role: next });
    await recordAudit(session, "team.role", who, { from: member.role, to: next });
    revalidatePath("/admin/team");
    return { ok: `Now ${roleInfo[next].label.toLowerCase()}. They'll be asked to sign in again.` };
  }
  if (intent === "disable" || intent === "enable") {
    const active = intent === "enable";
    await updateTeamMember(member.id, { active });
    await recordAudit(session, active ? "team.enabled" : "team.disabled", who);
    revalidatePath("/admin/team");
    return { ok: active ? "Login turned back on." : "Login turned off. They've been signed out." };
  }
  if (intent === "reset") {
    const password = generatePassword();
    await updateTeamMember(member.id, { password });
    await recordAudit(session, "team.password_reset", who);
    revalidatePath("/admin/team");
    return { ok: "New password made. Send it to them privately; it won't be shown again.", password };
  }
  return { error: "Unknown change." };
}

// ---------- My account (team members) ----------

export type PasswordState = { error?: string; ok?: boolean };

export async function changePassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const session = await requireAdmin();
  if (!session.userId) return { error: "The super admin password is ADMIN_PASSWORD, set in Vercel." };
  const member = await getTeamMember(session.userId);
  if (!member) return { error: "Your account was not found." };
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!(await verifyPassword(current, member.passwordHash))) return { error: "Your current password is not right." };
  if (next.length < 10) return { error: "Use at least 10 characters for the new password." };
  if (next !== String(form.get("confirm") ?? "")) return { error: "The two new passwords don't match." };
  const version = await changeOwnPassword(member.id, next);
  if (version) await startAdminSession(member.id, version);
  await recordAudit(session, "account.password", null);
  return { ok: true };
}
