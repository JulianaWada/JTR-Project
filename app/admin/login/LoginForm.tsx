"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";
import { buttonClass, inputClass } from "@/components/admin/ui";

export function LoginForm({ askEmail, emailOptional }: { askEmail: boolean; emailOptional?: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      {askEmail && (
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="username" required={!emailOptional} autoFocus className={inputClass} />
          {emailOptional && <p className="mt-1 text-xs text-muted">Super admin: leave empty until ADMIN_EMAIL is set.</p>}
        </div>
      )}
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus={!askEmail} className={inputClass} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${buttonClass} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
