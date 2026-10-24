"use client";

import { useActionState, useRef } from "react";
import { sendOwnerReply } from "@/app/dashboard/actions";

export function ReplyForm({ customerId, disabledReason }: { customerId: string; disabledReason?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: { error?: string } | undefined, form: FormData) => {
    const result = await sendOwnerReply(customerId, prev, form);
    if (!result.error) formRef.current?.reset();
    return result;
  }, undefined);
  return (
    <form ref={formRef} action={action} className="space-y-2">
      <textarea
        name="body"
        rows={2}
        className="input resize-none"
        placeholder={disabledReason ?? "Write a reply. The AI pauses while you're handling this chat."}
        disabled={!!disabledReason}
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end">
        <button className="btn-primary" disabled={pending || !!disabledReason}>
          {pending ? "Sending…" : "Send on WhatsApp"}
        </button>
      </div>
    </form>
  );
}
