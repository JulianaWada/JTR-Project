"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, teacherLogin } from "./actions";
import { PasswordInput } from "@/components/password-input";

export function LoginForm({ next, demo, teacher }: { next?: string; demo?: boolean; teacher?: boolean }) {
  const [state, action, pending] = useActionState(teacher ? teacherLogin : login, undefined);
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.email ?? (demo ? (teacher ? "jules@julestechright.com" : "ada@example.com") : undefined)} />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <PasswordInput id="password" name="password" required autoComplete="current-password" />
      </div>
      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
          {state.wrongPage === "teacher" && (
            <>
              {" "}
              <Link href={`/teacher-login${nextQuery}`} className="font-medium underline">
                Go to the teacher login
              </Link>
            </>
          )}
          {state.wrongPage === "student" && (
            <>
              {" "}
              <Link href="/login" className="font-medium underline">
                Go to the student login
              </Link>
            </>
          )}
        </p>
      )}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Logging in…" : teacher ? "Log in as a teacher" : "Log in"}
      </button>
    </form>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="name">
          Full name <span className="font-normal text-muted">(as it should appear on your certificate)</span>
        </label>
        <input className="input" id="name" name="name" required autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="phone">
          WhatsApp number <span className="font-normal text-muted">(optional)</span>
        </label>
        <input className="input" id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+234 …" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}
