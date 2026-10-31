"use client";

import { useActionState } from "react";
import { checkout } from "./actions";

export function CheckoutForm({ cohortId, price, testMode }: { cohortId: string; price: string; testMode: boolean }) {
  const [state, action, pending] = useActionState(checkout.bind(null, cohortId), undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="code">
          Discount code <span className="font-normal text-muted">(optional)</span>
        </label>
        <input className="input uppercase" id="code" name="code" autoComplete="off" placeholder="e.g. EARLYBIRD" />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn-primary h-12 w-full text-base" disabled={pending}>
        {pending ? "Starting checkout…" : `Pay ${price} with Paystack`}
      </button>
      <p className="text-center text-xs text-muted">
        {testMode ? "Test mode: you'll see a practice checkout and no money is taken." : "You'll be taken to Paystack's secure checkout."}
      </p>
    </form>
  );
}
