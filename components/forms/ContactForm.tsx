"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { getCountries, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";
import { approxUsdRates, budgetBrackets, budgetRanges, currencies, serviceIds, siteConfig } from "@/content/site";
import { leadSchema, type LeadInput } from "@/lib/leads/schema";
import { Link } from "@/i18n/navigation";
import { Field, inputClass } from "./Field";
import { PhoneField } from "./PhoneField";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Status = "idle" | "sending" | "success" | "error";

/** Round to 2 significant figures so converted budgets read naturally (e.g. 15M, not 15,000,000.00). */
function niceRound(n: number) {
  if (n === 0) return 0;
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
}

function browserRegion(): CountryCode | undefined {
  const region = navigator.language.split("-")[1]?.toUpperCase();
  return region && (getCountries() as string[]).includes(region) ? (region as CountryCode) : undefined;
}

export function ContactForm() {
  const t = useTranslations("contact.form");
  const tServices = useTranslations("services");
  const locale = useLocale();
  const format = useFormatter();

  const [status, setStatus] = useState<Status>("idle");
  const [sentTo, setSentTo] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("US");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [timeZones, setTimeZones] = useState<string[]>([]);

  // Country names come from the browser's Intl data (server and browser data can differ, so build them after mount).
  const [countryNames, setCountryNames] = useState<Intl.DisplayNames | null>(null);

  const countryOptions = useMemo(
    () =>
      getCountries()
        .map((c) => ({ code: c, name: countryNames?.of(c) ?? c }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [countryNames, locale],
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { source: "contact-form", locale: locale as LeadInput["locale"], currency: "USD", website: "" },
  });

  const currency = useWatch({ control, name: "currency" }) ?? "USD";

  // Fill sensible defaults from the browser: time zone, country and any ?service= from a CTA.
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [tz];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only values
    setTimeZones(zones.includes(tz) ? zones : [tz, ...zones]);
    setValue("timezone", tz);
    try {
      setCountryNames(new Intl.DisplayNames([locale], { type: "region" }));
    } catch {}

    const region = browserRegion();
    if (region) {
      setPhoneCountry(region);
      setValue("country", region);
    }

    const service = new URLSearchParams(window.location.search).get("service");
    if (service && (serviceIds as readonly string[]).includes(service)) {
      setValue("service", service as LeadInput["service"]);
    }
  }, [setValue, locale]);

  // Keep the hidden `phone` field in sync with the picker + number, in international format.
  useEffect(() => {
    const parsed = phoneNumber.trim() ? parsePhoneNumberFromString(phoneNumber, phoneCountry) : undefined;
    setValue("phone", phoneNumber.trim() ? (parsed?.number ?? phoneNumber) : undefined, {
      shouldValidate: Boolean(errors.phone),
    });
  }, [phoneNumber, phoneCountry, setValue, errors.phone]);

  const budgetLabel = (range: (typeof budgetRanges)[number]) => {
    const bracket = budgetBrackets[range];
    if (!bracket) return t("budgetNotSure");
    const rate = approxUsdRates[currency as keyof typeof approxUsdRates] ?? 1;
    const fmt = (n: number) =>
      format.number(niceRound(n * rate), { style: "currency", currency, maximumFractionDigits: 0 });
    const [min, max] = bracket;
    if (min === 0) return `< ${fmt(max)}`;
    if (max === Infinity) return `${fmt(min)}+`;
    return `${fmt(min)} – ${fmt(max)}`;
  };

  const errorText = (key?: string) => (key ? t(`errors.${key}` as "errors.required") : undefined);
  const describedBy = (name: string, hasHint = false) =>
    errors[name as keyof typeof errors] ? `${name}-error` : hasHint ? `${name}-hint` : undefined;

  const onSubmit = async (data: LeadInput) => {
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSentTo(data.email);
      setStatus("success");
      reset();
      setPhoneNumber("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div role="status" className="rounded-card border border-success/40 bg-surface p-8 text-center">
        <span className="mx-auto inline-grid size-14 place-items-center rounded-full bg-success/15 text-success">
          <Icon name="check" size={28} />
        </span>
        <h3 className="font-display mt-5 text-2xl font-semibold text-ink">{t("successTitle")}</h3>
        <p className="mt-2 text-muted">{t("successBody", { email: sentTo })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it in. */}
      <div aria-hidden="true" className="absolute -start-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <Field id="name" label={t("name")} error={errorText(errors.name?.message)}>
        <input id="name" autoComplete="name" className={inputClass} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} {...register("name")} />
      </Field>

      <Field id="email" label={t("email")} error={errorText(errors.email?.message)}>
        <input id="email" type="email" autoComplete="email" dir="ltr" className={inputClass} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} {...register("email")} />
      </Field>

      <Field id="phone" className="sm:col-span-2" label={t("phone")} optionalLabel={t("optional")} hint={t("phoneHint")} error={errorText(errors.phone?.message)}>
        <PhoneField
          id="phone"
          country={phoneCountry}
          onCountryChange={setPhoneCountry}
          number={phoneNumber}
          onNumberChange={setPhoneNumber}
          countryNames={countryNames}
          countryLabel={t("country")}
          invalid={!!errors.phone}
          describedBy={describedBy("phone", true)}
        />
      </Field>

      <Field id="company" label={t("company")} optionalLabel={t("optional")} error={errorText(errors.company?.message)}>
        <input id="company" autoComplete="organization" className={inputClass} {...register("company")} />
      </Field>

      <Field id="country" label={t("country")} optionalLabel={t("optional")}>
        <select
          id="country"
          autoComplete="country"
          className={inputClass}
          {...register("country", {
            setValueAs: (v) => v || undefined,
            onChange: (e) => e.target.value && setPhoneCountry(e.target.value as CountryCode),
          })}
        >
          <option value="">{t("countryPlaceholder")}</option>
          {countryOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field id="timezone" label={t("timezone")} optionalLabel={t("optional")}>
        <select id="timezone" className={inputClass} {...register("timezone", { setValueAs: (v) => v || undefined })}>
          {timeZones.map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </Field>

      <Field id="service" label={t("service")} optionalLabel={t("optional")} className="sm:col-span-2">
        <select id="service" className={inputClass} {...register("service", { setValueAs: (v) => v || undefined })}>
          <option value="">{t("servicePlaceholder")}</option>
          {serviceIds.map((id) => (
            <option key={id} value={id}>
              {tServices(`${id}.name`)}
            </option>
          ))}
          <option value="other">{t("serviceOther")}</option>
        </select>
      </Field>

      <div className="grid gap-5 sm:col-span-2 sm:grid-cols-[1fr_10rem]">
        <Field id="budget" label={t("budget")} optionalLabel={t("optional")}>
          <select id="budget" className={inputClass} {...register("budget", { setValueAs: (v) => v || undefined })}>
            <option value="">{t("budgetPlaceholder")}</option>
            {budgetRanges.map((r) => (
              <option key={r} value={r}>
                {budgetLabel(r)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="currency" label={t("currency")}>
          <select id="currency" className={inputClass} {...register("currency")}>
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="message" label={t("message")} hint={t("messageHint")} error={errorText(errors.message?.message)} className="sm:col-span-2">
        <textarea
          id="message"
          rows={6}
          className={cn(inputClass, "resize-y")}
          aria-invalid={!!errors.message}
          aria-describedby={describedBy("message", true)}
          {...register("message")}
        />
      </Field>

      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-sm text-muted">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            {...register("consent", { setValueAs: (v) => (v ? true : undefined) })}
          />
          <span>
            {t.rich("consent", {
              link: (chunks) => (
                <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="mt-2 text-sm font-medium text-danger">
            {errorText(errors.consent.message)}
          </p>
        )}
      </div>

      {status === "error" && (
        <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink sm:col-span-2">
          <p className="font-semibold">{t("errorTitle")}</p>
          <p className="mt-1">{t("errorBody", { email: siteConfig.contact.email })}</p>
        </div>
      )}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" icon="send" disabled={status === "sending"} className="w-full sm:w-auto">
          {status === "sending" ? t("sending") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
