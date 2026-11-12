"use client";

import { useActionState } from "react";
import { addMember, changeMember, type MemberState, type TeamState } from "../../actions";
import { buttonClass, inputClass } from "@/components/admin/ui";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
];

function NewPassword({ password, note }: { password: string; note: string }) {
  return (
    <div role="status" className="rounded-xl border border-success/30 bg-success/8 px-4 py-3 text-sm">
      <p className="text-ink">{note}</p>
      <p className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-surface px-2.5 py-1 font-mono text-base font-semibold tracking-wide text-ink select-all">{password}</code>
        <span className="text-xs text-muted">Shown once only.</span>
      </p>
    </div>
  );
}

export function AddMemberForm() {
  const [state, action, pending] = useActionState<TeamState, FormData>(addMember, {});
  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_10rem_auto] md:items-end">
        <div>
          <label htmlFor="member-name" className="mb-1.5 block text-sm font-semibold text-ink">
            Name
          </label>
          <input id="member-name" name="name" required maxLength={80} autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor="member-email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email
          </label>
          <input id="member-email" name="email" type="email" required maxLength={200} autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor="member-role" className="mb-1.5 block text-sm font-semibold text-ink">
            Role
          </label>
          <select id="member-role" name="role" defaultValue="staff" className={inputClass}>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Adding…" : "Add person"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.created && (
        <NewPassword
          password={state.created.password}
          note={`${state.created.name} can now sign in at the admin board with ${state.created.email} and this password:`}
        />
      )}
    </div>
  );
}

export function MemberControls({ id, name, role, active }: { id: string; name: string; role: string; active: boolean }) {
  const [state, action, pending] = useActionState<MemberState, FormData>(changeMember, {});
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="intent" value="role" />
          <select
            name="role"
            defaultValue={role}
            aria-label={`Role for ${name}`}
            disabled={pending}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink focus:border-primary focus:outline-none"
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <noscript>
            <button type="submit" className="text-sm font-semibold text-primary">
              Save
            </button>
          </noscript>
        </form>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="intent" value="reset" />
          <button type="submit" disabled={pending} className="h-9 rounded-lg border border-line px-3 text-sm font-semibold text-ink hover:border-primary hover:text-primary">
            New password
          </button>
        </form>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="intent" value={active ? "disable" : "enable"} />
          <button
            type="submit"
            disabled={pending}
            className={
              active
                ? "h-9 rounded-lg border border-danger/30 px-3 text-sm font-semibold text-danger hover:bg-danger/8"
                : "h-9 rounded-lg border border-line px-3 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
            }
          >
            {active ? "Turn off login" : "Turn login on"}
          </button>
        </form>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.password ? <NewPassword password={state.password} note={`New password for ${name}:`} /> : state.ok && <p className="text-sm text-success">{state.ok}</p>}
    </div>
  );
}
