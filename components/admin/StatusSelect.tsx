"use client";

import { useRef } from "react";

/** A status dropdown that saves as soon as it changes. Works without JavaScript through the Save button. */
export function StatusSelect({
  id,
  value,
  options,
  action,
  label,
}: {
  id: string;
  value: string;
  options: readonly string[];
  action: (form: FormData) => Promise<void>;
  label: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={value}
        aria-label={label}
        onChange={() => form.current?.requestSubmit()}
        className="h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="text-sm font-semibold text-primary">
          Save
        </button>
      </noscript>
    </form>
  );
}
