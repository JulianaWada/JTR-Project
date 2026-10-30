"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createBusiness, type AddBusinessState } from "../../../actions";
import { buttonClass, inputClass, secondaryButtonClass } from "@/components/admin/ui";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function AddBusinessForm({ appUrl }: { appUrl?: string }) {
  const [state, action, pending] = useActionState<AddBusinessState, FormData>(createBusiness, {});
  const [name, setName] = useState(state.values?.name ?? "");
  const [slug, setSlug] = useState(state.values?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);

  if (state.result?.ok) {
    const loginUrl = appUrl ? `${appUrl}/login` : "the agent's /login page";
    return (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-success">Business added.</p>
        <p className="text-sm text-ink">Send these sign-in details to the owner. The password is shown only once.</p>
        <dl className="grid gap-2 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted">Sign in at</dt>
          <dd className="font-semibold break-all text-ink">{loginUrl}</dd>
          <dt className="text-muted">Business</dt>
          <dd className="font-semibold text-ink">{state.result.slug}</dd>
          <dt className="text-muted">Password</dt>
          <dd className="font-mono font-semibold text-ink">{state.result.password}</dd>
        </dl>
        <p className="text-sm text-muted">
          Next, the owner adds their services or products, opening hours and policies under Settings in their dashboard. They can try the agent
          straight away in the Simulator.
        </p>
        <div className="flex gap-2">
          <Link href="/admin/whatsapp" className={buttonClass}>
            Back to businesses
          </Link>
          {/* A full reload clears the form state. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin/whatsapp/new" className={secondaryButtonClass}>
            Add another
          </a>
        </div>
      </div>
    );
  }

  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Field label="Business name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(toSlug(e.target.value));
          }}
          className={inputClass}
          placeholder="Glow Up Studio"
        />
      </Field>
      <Field label="Short name" htmlFor="slug" hint="Used to sign in. Lowercase letters, numbers and dashes.">
        <input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className={inputClass}
          placeholder="glow-up-studio"
        />
      </Field>
      <Field label="Type of business" htmlFor="kind" hint="Salons take bookings; food vendors take orders.">
        <select id="kind" name="kind" defaultValue={v.kind ?? "salon"} className={inputClass}>
          <option value="salon">Salon or services (bookings)</option>
          <option value="food">Food vendor or shop (orders)</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="WhatsApp phone number ID" htmlFor="whatsappPhoneNumberId" hint="From Meta's WhatsApp Manager, under the business's phone number.">
        <input id="whatsappPhoneNumberId" name="whatsappPhoneNumberId" required inputMode="numeric" defaultValue={v.whatsappPhoneNumberId} className={inputClass} placeholder="109876543210987" />
      </Field>
      <Field label="WhatsApp number customers see" htmlFor="whatsappDisplayNumber">
        <input id="whatsappDisplayNumber" name="whatsappDisplayNumber" defaultValue={v.whatsappDisplayNumber} className={inputClass} placeholder="+234 803 000 0000" />
      </Field>
      <Field label="Owner's WhatsApp number" htmlFor="ownerPhone" hint="Gets an alert when the agent hands a chat over to a person.">
        <input id="ownerPhone" name="ownerPhone" defaultValue={v.ownerPhone} className={inputClass} placeholder="+234 803 000 0000" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Address" htmlFor="address">
          <input id="address" name="address" defaultValue={v.address} className={inputClass} placeholder="12 Admiralty Way, Lekki, Lagos" />
        </Field>
      </div>
      {state.result && !state.result.ok && (
        <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
          {state.result.error}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Adding…" : "Add business"}
        </button>
        <Link href="/admin/whatsapp" className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
