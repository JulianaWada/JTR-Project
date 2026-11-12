"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "../../actions";
import { buttonClass, inputClass } from "@/components/admin/ui";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-4">
      {[
        { name: "current", label: "Current password", auto: "current-password" },
        { name: "next", label: "New password (at least 10 characters)", auto: "new-password" },
        { name: "confirm", label: "New password again", auto: "new-password" },
      ].map((f) => (
        <div key={f.name}>
          <label htmlFor={`pw-${f.name}`} className="mb-1.5 block text-sm font-semibold text-ink">
            {f.label}
          </label>
          <input id={`pw-${f.name}`} name={f.name} type="password" required autoComplete={f.auto} className={inputClass} />
        </div>
      ))}
      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.ok && !pending && <p className="text-sm font-medium text-success">Password changed. You&apos;re signed out everywhere else.</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
