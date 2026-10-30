"use client";

import { useActionState } from "react";
import { submitAssignment } from "./actions";

export function SubmitForm({ cohortId, assignmentId, text, link, resubmit }: { cohortId: string; assignmentId: string; text: string; link: string; resubmit: boolean }) {
  const [state, action, pending] = useActionState(submitAssignment.bind(null, cohortId, assignmentId), undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="link">
          Link to your work <span className="font-normal text-muted">(Google Doc, Drive, YouTube…)</span>
        </label>
        <input className="input" id="link" name="link" type="url" defaultValue={link} placeholder="https://" />
      </div>
      <div>
        <label className="label" htmlFor="text">
          Your answer or a note for Jules
        </label>
        <textarea className="input min-h-40" id="text" name="text" defaultValue={text} />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-success">Handed in. Jules will mark it and you&apos;ll see feedback here.</p>}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Handing in…" : resubmit ? "Hand in again" : "Hand in"}
      </button>
    </form>
  );
}
