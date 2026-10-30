"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";
import { academyCourses, academyInterestSchema, heardFromOptions, type AcademyInterestInput } from "@/lib/academy/interest-schema";
import { siteConfig } from "@/content/site";
import { Link } from "@/i18n/navigation";
import { Field, inputClass } from "./Field";
import { PhoneField } from "./PhoneField";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Status = "idle" | "sending" | "success" | "error";

export function AcademyInterestForm() {
  const t = useTranslations("academyInterest.form");
  const locale = useLocale();

  const [status, setStatus] = useState<Status>("idle");
  // Most of the audience is in Nigeria, so +234 is the default country code (browsers often report en-US there).
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("NG");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryNames, setCountryNames] = useState<Intl.DisplayNames | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AcademyInterestInput>({
    resolver: zodResolver(academyInterestSchema),
    defaultValues: { locale: locale as AcademyInterestInput["locale"], website: "" },
  });

  // Country names come from the browser's Intl data, and ?course= preselects a course from a link.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only values
      setCountryNames(new Intl.DisplayNames([locale], { type: "region" }));
    } catch {}

    const course = new URLSearchParams(window.location.search).get("course");
    if (course && (academyCourses as readonly string[]).includes(course)) {
      setValue("course", course as AcademyInterestInput["course"]);
    }
  }, [setValue, locale]);

  // Keep the hidden `phone` field in sync with the picker + number, in international format.
  useEffect(() => {
    const parsed = phoneNumber.trim() ? parsePhoneNumberFromString(phoneNumber, phoneCountry) : undefined;
    setValue("phone", phoneNumber.trim() ? (parsed?.number ?? phoneNumber) : "", {
      shouldValidate: Boolean(errors.phone),
    });
  }, [phoneNumber, phoneCountry, setValue, errors.phone]);

  const errorText = (key?: string) => (key ? t(`errors.${key}` as "errors.required") : undefined);
  const describedBy = (name: string, hasHint = false) =>
    errors[name as keyof typeof errors] ? `${name}-error` : hasHint ? `${name}-hint` : undefined;

  const onSubmit = async (data: AcademyInterestInput) => {
    setStatus("sending");
    try {
      const res = await fetch("/api/academy-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
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
        <p className="mt-2 text-muted">{t("successBody")}</p>
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

      <Field id="name" label={t("name")} error={errorText(errors.name?.message)} className="sm:col-span-2">
        <input id="name" autoComplete="name" className={inputClass} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} {...register("name")} />
      </Field>

      <Field id="phone" className="sm:col-span-2" label={t("phone")} hint={t("phoneHint")} error={errorText(errors.phone?.message)}>
        <PhoneField
          id="phone"
          country={phoneCountry}
          onCountryChange={setPhoneCountry}
          number={phoneNumber}
          onNumberChange={setPhoneNumber}
          countryNames={countryNames}
          countryLabel={t("countryCode")}
          invalid={!!errors.phone}
          describedBy={describedBy("phone", true)}
        />
      </Field>

      <Field id="email" label={t("email")} optionalLabel={t("optional")} error={errorText(errors.email?.message)}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          className={inputClass}
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email")}
          {...register("email", { setValueAs: (v) => v || undefined })}
        />
      </Field>

      <Field id="location" label={t("location")} optionalLabel={t("optional")} error={errorText(errors.location?.message)}>
        <input
          id="location"
          autoComplete="address-level2"
          placeholder={t("locationPlaceholder")}
          className={inputClass}
          {...register("location", { setValueAs: (v) => v || undefined })}
        />
      </Field>

      <fieldset className="sm:col-span-2" aria-describedby={errors.course ? "course-error" : undefined}>
        <legend className="text-sm font-semibold text-ink">{t("course")}</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {academyCourses.map((c) => (
            <label
              key={c}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border bg-bg px-4 py-3 text-ink transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft",
                errors.course ? "border-danger" : "border-line",
              )}
            >
              <input type="radio" value={c} className="size-4 accent-[var(--primary)]" {...register("course")} />
              <span className="text-sm font-medium">{t(`courses.${c}`)}</span>
            </label>
          ))}
        </div>
        {errors.course && (
          <p id="course-error" className="mt-2 text-sm font-medium text-danger">
            {errorText(errors.course.message)}
          </p>
        )}
      </fieldset>

      <Field id="heardFrom" label={t("heardFrom")} optionalLabel={t("optional")} className="sm:col-span-2">
        <select id="heardFrom" className={inputClass} {...register("heardFrom", { setValueAs: (v) => v || undefined })}>
          <option value="">{t("heardFromPlaceholder")}</option>
          {heardFromOptions.map((h) => (
            <option key={h} value={h}>
              {t(`heardFromOptions.${h}`)}
            </option>
          ))}
        </select>
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
