"use client";

import { useActionState, useState } from "react";
import { checkout } from "./actions";

/**
 * `usdPrice` is set when the course can also be paid in US dollars. `defaultCurrency` comes from the
 * visitor's location (naira in Nigeria, dollars elsewhere); a small link switches for people who need the other one.
 */
export function CheckoutForm({
  cohortId,
  price,
  usdPrice,
  defaultCurrency = "NGN",
  testMode,
}: {
  cohortId: string;
  price: string;
  usdPrice?: string | null;
  defaultCurrency?: "NGN" | "USD";
  testMode: boolean;
}) {
  const [state, action, pending] = useActionState(checkout.bind(null, cohortId), undefined);
  const [currency, setCurrency] = useState<"NGN" | "USD">(usdPrice ? defaultCurrency : "NGN");
  const shown = currency === "USD" && usdPrice ? usdPrice : price;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="currency" value={currency} />
      <div>
        <label className="label" htmlFor="code">
          Discount code <span className="font-normal text-muted">(optional)</span>
        </label>
        <input className="input uppercase" id="code" name="code" autoComplete="off" placeholder="e.g. EARLYBIRD" />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn-primary h-12 w-full text-base" disabled={pending}>
        {pending ? "Starting checkout…" : `Pay ${shown} with Paystack`}
      </button>
      <p className="text-center text-xs text-muted">
        {testMode
          ? "Test mode: you'll see a practice checkout and no money is taken."
          : currency === "USD"
            ? "You'll be taken to Paystack's secure checkout to pay by card in US dollars."
            : "You'll be taken to Paystack's secure checkout."}
      </p>
      {usdPrice && (
        <p className="text-center text-xs">
          <button type="button" className="text-primary hover:underline" onClick={() => setCurrency(currency === "USD" ? "NGN" : "USD")}>
            {currency === "USD" ? `Paying from Nigeria? Pay ${price} in naira instead` : `Paying from outside Nigeria? Pay ${usdPrice} in US dollars instead`}
          </button>
        </p>
      )}
    </form>
  );
}
