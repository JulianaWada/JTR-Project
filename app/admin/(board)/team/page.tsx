import { redirect } from "next/navigation";
import { PageTitle, Panel, Pill, Table, Td } from "@/components/admin/ui";
import { adminEmail, requireAdmin } from "@/lib/admin/auth";
import { formatDateTime } from "@/lib/admin/money";
import { assignableRoles, can, roleInfo } from "@/lib/admin/roles";
import { listTeam } from "@/lib/admin/team";
import { AddMemberForm, MemberControls } from "./TeamForms";

export const metadata = { title: "Team & roles" };

export default async function TeamPage() {
  const session = await requireAdmin();
  if (!can(session.role, "team.manage")) redirect("/admin");
  const team = await listTeam();
  const roles = (["super_admin", ...assignableRoles] as const).map((r) => ({ role: r, ...roleInfo[r] }));

  return (
    <>
      <PageTitle
        title="Team & roles"
        subtitle="Give people their own login to the admin board, with a role that decides what they can change. Every sign-in and change is kept in the audit trail."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {roles.map((r) => (
          <div key={r.role} className="rounded-card border border-line bg-surface p-5">
            <Pill tone={r.role === "super_admin" ? "blue" : r.role === "viewer" ? "neutral" : r.role === "admin" ? "green" : "amber"}>{r.label}</Pill>
            <p className="mt-2 text-sm text-muted">{r.summary}</p>
          </div>
        ))}
      </div>

      <Panel title="Add a person" subtitle="A password is made for them. Send it privately (e.g. WhatsApp); they can change it under My account.">
        <div className="px-5 pb-5">
          <AddMemberForm />
        </div>
      </Panel>

      <Panel title={`${team.length + 1} ${team.length === 0 ? "person" : "people"}`}>
        <Table head={["Person", "Role", "Last sign-in", "Changes"]} empty="">
          <tr>
            <Td>
              <p className="font-semibold text-ink">{session.role === "super_admin" ? `${session.name} (you)` : "Super admin"}</p>
              <p className="text-muted">{adminEmail() ?? "Signs in with ADMIN_PASSWORD"}</p>
            </Td>
            <Td>
              <Pill tone="blue">Super admin</Pill>
            </Td>
            <Td className="text-muted">—</Td>
            <Td className="text-xs text-muted">Set in Vercel (ADMIN_EMAIL, ADMIN_PASSWORD)</Td>
          </tr>
          {team.map((m) => (
            <tr key={m.id} className={m.active ? undefined : "opacity-60"}>
              <Td>
                <p className="font-semibold text-ink">{m.name}</p>
                <p className="text-muted">{m.email}</p>
                <p className="mt-1 text-xs text-muted">Added {formatDateTime(m.createdAt)}</p>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  <Pill tone={m.role === "admin" ? "green" : m.role === "staff" ? "amber" : "neutral"}>{roleInfo[m.role].label}</Pill>
                  {!m.active && <Pill tone="red">Turned off</Pill>}
                </div>
              </Td>
              <Td className="whitespace-nowrap text-muted">{m.lastLoginAt ? formatDateTime(m.lastLoginAt) : "Not yet"}</Td>
              <Td>
                <MemberControls id={m.id} name={m.name} role={m.role} active={m.active} />
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
