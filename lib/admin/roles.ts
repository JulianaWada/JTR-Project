import type { AdminRole } from "@/lib/db/schema";

// Who can do what on the admin board. Everyone signed in can look at every page;
// these permissions decide who can change things. Checked on the server in every action.

export type Role = "super_admin" | AdminRole;

export type Permission =
  | "leads.update" // change the status of leads and academy sign-ups
  | "export" // download leads and sign-ups as CSV (personal data)
  | "projects.edit" // show/hide, reorder and edit website projects
  | "whatsapp.add" // add a business to the WhatsApp agent
  | "team.manage" // add people, change roles, reset passwords
  | "audit.view"; // read the audit trail

const grants: Record<Role, Permission[]> = {
  super_admin: ["leads.update", "export", "projects.edit", "whatsapp.add", "team.manage", "audit.view"],
  admin: ["leads.update", "export", "projects.edit", "whatsapp.add", "audit.view"],
  staff: ["leads.update"],
  viewer: [],
};

export function can(role: Role, permission: Permission) {
  return grants[role].includes(permission);
}

/** Roles a super admin can give to team members. */
export const assignableRoles: AdminRole[] = ["admin", "staff", "viewer"];

export const roleInfo: Record<Role, { label: string; summary: string }> = {
  super_admin: { label: "Super admin", summary: "Everything, including the team and the audit trail." },
  admin: { label: "Admin", summary: "Can change leads, projects and the WhatsApp agent, download CSVs and read the audit trail. Can't manage the team." },
  staff: { label: "Staff", summary: "Can see everything and update the status of leads and academy sign-ups. Can't edit projects, add businesses or download CSVs." },
  viewer: { label: "Viewer", summary: "Can look at every page but can't change or download anything." },
};

export function isRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (assignableRoles as string[]).includes(value);
}
