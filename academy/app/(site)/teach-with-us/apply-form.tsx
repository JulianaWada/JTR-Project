"use client";

import { useActionState } from "react";
import { applyToTeach } from "./actions";

export function ApplyForm({ signedIn, defaults }: { signedIn: boolean; defaults?: { brandName: string; headline: string; subjects: string; website: string; bio: string } }) {
  const [state, action, pending] = useActionState(applyToTeach, undefined);
  return (
    <form action={action} className="space-y-5">
      {!signedIn && (
        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold text-ink">Your account</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">
                Full name
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
              <input className="input" id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
            </div>
          </div>
        </fieldset>
      )}
      <fieldset className="space-y-4">
        <legend className="font-display text-lg font-semibold text-ink">About your teaching</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="brandName">
              School or brand name <span className="font-normal text-muted">(optional)</span>
            </label>
            <input className="input" id="brandName" name="brandName" maxLength={80} placeholder="e.g. Ada's Design Studio" defaultValue={defaults?.brandName} />
          </div>
          <div>
            <label className="label" htmlFor="headline">
              One line about you <span className="font-normal text-muted">(optional)</span>
            </label>
            <input className="input" id="headline" name="headline" maxLength={120} placeholder="e.g. Graphic designer, 8 years" defaultValue={defaults?.headline} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="subjects">
            What would you like to teach?
          </label>
          <textarea className="input min-h-24" id="subjects" name="subjects" required minLength={10} maxLength={1000} placeholder="The course or courses you have in mind, and who they're for." defaultValue={defaults?.subjects} />
        </div>
        <div>
          <label className="label" htmlFor="bio">
            Your experience <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea className="input min-h-24" id="bio" name="bio" maxLength={2000} placeholder="Where you've taught or worked, and what students say about you." defaultValue={defaults?.bio} />
        </div>
        <div>
          <label className="label" htmlFor="website">
            Website or social media link <span className="font-normal text-muted">(optional)</span>
          </label>
          <input className="input" id="website" name="website" maxLength={200} placeholder="https://instagram.com/…" defaultValue={defaults?.website} />
        </div>
      </fieldset>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Sending…" : "Send my application"}
      </button>
    </form>
  );
}
