"use client";

import { useMemo } from "react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";
import { inputClass } from "./Field";
import { cn } from "@/lib/cn";

/**
 * International phone input: a country-code picker plus a number field.
 * The combined value is stored in E.164-ish form (+<code><number>).
 */
export function PhoneField({
  id,
  country,
  onCountryChange,
  number,
  onNumberChange,
  countryNames,
  countryLabel,
  invalid,
  describedBy,
}: {
  id: string;
  country: CountryCode;
  onCountryChange: (c: CountryCode) => void;
  number: string;
  onNumberChange: (n: string) => void;
  countryNames: Intl.DisplayNames | null;
  countryLabel: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const options = useMemo(
    () =>
      getCountries()
        .map((c) => ({ code: c, name: countryNames?.of(c) ?? c, dial: getCountryCallingCode(c) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [countryNames],
  );

  return (
    <div className="flex gap-2" dir="ltr">
      <select
        aria-label={countryLabel}
        value={country}
        onChange={(e) => onCountryChange(e.target.value as CountryCode)}
        className={cn(inputClass, "w-36 shrink-0 px-3")}
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.code} +{o.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={number}
        onChange={(e) => onNumberChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={inputClass}
      />
    </div>
  );
}
