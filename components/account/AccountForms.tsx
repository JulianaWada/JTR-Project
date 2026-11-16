"use client";

import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";
import { Link, useRouter } from "@/i18n/navigation";
import { Field, inputClass } from "@/components/forms/Field";
import { PhoneField } from "@/components/forms/PhoneField";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { memberInterests, PASSWORD_MIN } from "@/lib/members/schema";
import { cn } from "@/lib/cn";
import { readCampaign, rememberCampaign } from "@/lib/members/campaign";
import type { FormState } from "@/app/[locale]/account/actions";
import {
  deleteAccountAction,
  forgotPasswordAction,
  loginAction,
  logoutAction,
  resetPasswordAction,
  signupAction,
  unsubscribeAction,
  updateProfileAction,
} from "@/app/[locale]/account/actions";

type Action = (form: FormData) => Promise<FormState>;

/** Runs a server action without resetting the form, so typed values stay when something needs fixing. */
function useSubmit(action: Action, onOk?: () => void) {
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(async () => {
      const result = await action(data);
      setState(result);
      if (result.ok) onOk?.();
    });
  };
  return { state, pending, onSubmit };
}

function useErrorText() {
  const t = useTranslations("account.errors");
  return (key?: string) => (key ? t(key as "required") : undefined);
}

function FormAlert({ state }: { state: FormState }) {
  const t = useTranslations("account.errors");
  if (!state.error || state.error === "invalid") return null;
  return (
    <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink sm:col-span-2">
      {t(state.error)}
    </div>
  );
}

function PasswordInput({ id, autoComplete, invalid, describedBy }: { id: string; autoComplete: string; invalid?: boolean; describedBy?: string }) {
  const t = useTranslations("account.fields");
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name="password"
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        dir="ltr"
        className={cn(inputClass, "pe-20")}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        required
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        className="absolute inset-y-0 end-2 my-auto h-8 rounded-lg px-3 text-xs font-semibold text-primary hover:bg-primary-soft"
        aria-pressed={shown}
      >
        {shown ? t("hide") : t("show")}
      </button>
    </div>
  );
}

/** A phone picker that submits one international number in a hidden `phone` field. */
function PhoneInput({ initial, invalid, describedBy }: { initial?: string | null; invalid?: boolean; describedBy?: string }) {
  const t = useTranslations("account.fields");
  const locale = useLocale();
  const parsedInitial = initial ? parsePhoneNumberFromString(initial) : undefined;
  // Most visitors are in Nigeria, so +234 is the default country code.
  const [country, setCountry] = useState<CountryCode>(parsedInitial?.country ?? "NG");
  const [number, setNumber] = useState(parsedInitial ? parsedInitial.formatNational() : (initial ?? ""));
  const [countryNames, setCountryNames] = useState<Intl.DisplayNames | null>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only values
      setCountryNames(new Intl.DisplayNames([locale], { type: "region" }));
    } catch {}
  }, [locale]);
  const parsed = number.trim() ? parsePhoneNumberFromString(number, country) : undefined;
  const value = number.trim() ? (parsed?.number ?? number) : "";
  return (
    <>
      <PhoneField
        id="phone"
        country={country}
        onCountryChange={setCountry}
        number={number}
        onNumberChange={setNumber}
        countryNames={countryNames}
        countryLabel={t("countryCode")}
        invalid={invalid}
        describedBy={describedBy}
      />
      <input type="hidden" name="phone" value={value} />
    </>
  );
}

function Interests({ initial = [] }: { initial?: string[] }) {
  const t = useTranslations("account");
  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-sm font-semibold text-ink">
        {t("fields.interestsLegend")} <span className="font-normal text-muted">({t("fields.optional")})</span>
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {memberInterests.map((i) => (
          <label
            key={i}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-bg px-4 py-2 text-sm font-medium text-ink transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary"
          >
            <input type="checkbox" name="interests" value={i} defaultChecked={initial.includes(i)} className="size-4 accent-[var(--primary)]" />
            {t(`interests.${i}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function MarketingChoices({ initial, phoneError }: { initial?: { email: boolean; whatsapp: boolean }; phoneError?: boolean }) {
  const t = useTranslations("account.fields");
  const box = "mt-0.5 size-5 shrink-0 accent-[var(--primary)]";
  return (
    <fieldset className="rounded-xl border border-line bg-surface-2/50 p-4 sm:col-span-2">
      <legend className="px-1 text-sm font-semibold text-ink">{t("consentLegend")}</legend>
      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 text-sm text-ink">
          <input type="checkbox" name="marketingEmail" defaultChecked={initial?.email} className={box} />
          <span>{t("marketingEmail")}</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-ink">
          <input type="checkbox" name="marketingWhatsapp" defaultChecked={initial?.whatsapp} className={box} aria-invalid={phoneError} />
          <span>{t("marketingWhatsapp")}</span>
        </label>
      </div>
      <p className="mt-3 text-xs text-muted">{t("consentNote")}</p>
    </fieldset>
  );
}

function privacyLink(chunks: ReactNode) {
  return (
    <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">
      {chunks}
    </Link>
  );
}

// ---------- Sign up ----------

export function SignupForm() {
  const t = useTranslations("account");
  const locale = useLocale();
  const router = useRouter();
  const errorText = useErrorText();
  const [campaign, setCampaign] = useState<Record<string, string>>({});
  useEffect(() => {
    rememberCampaign();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only values
    setCampaign(readCampaign());
  }, []);
  const { state, pending, onSubmit } = useSubmit(signupAction, () => {
    router.replace("/account?welcome=1");
    router.refresh();
  });
  const f = state.fields ?? {};
  const err = (name: string) => (f[name] ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-5 sm:grid-cols-2">
      <div aria-hidden="true" className="absolute -start-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input type="hidden" name="locale" value={locale} />
      {Object.entries(campaign).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <Field id="name" label={t("fields.name")} error={errorText(f.name)} className="sm:col-span-2">
        <input id="name" name="name" autoComplete="name" className={inputClass} aria-invalid={!!f.name} aria-describedby={err("name")} required />
      </Field>
      <Field id="email" label={t("fields.email")} error={errorText(f.email)}>
        <input id="email" name="email" type="email" autoComplete="email" dir="ltr" className={inputClass} aria-invalid={!!f.email} aria-describedby={err("email")} required />
      </Field>
      <Field id="password" label={t("fields.password")} hint={t("fields.passwordHint", { min: PASSWORD_MIN })} error={errorText(f.password)}>
        <PasswordInput id="password" autoComplete="new-password" invalid={!!f.password} describedBy={err("password") ?? "password-hint"} />
      </Field>
      <Field id="phone" label={t("fields.phone")} optionalLabel={t("fields.optional")} hint={t("fields.phoneHint")} error={errorText(f.phone)} className="sm:col-span-2">
        <PhoneInput invalid={!!f.phone} describedBy={err("phone") ?? "phone-hint"} />
      </Field>
      <Interests />
      <MarketingChoices phoneError={f.phone === "phoneForWhatsapp"} />

      <FormAlert state={state} />
      {state.error === "exists" && (
        <p className="text-sm sm:col-span-2">
          <Link href="/account/login" className="font-semibold text-primary">
            {t("signup.signInInstead")}
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-4 sm:col-span-2">
        <Button type="submit" size="lg" icon="arrowRight" disabled={pending} className="w-full sm:w-auto sm:self-start">
          {pending ? t("signup.sending") : t("signup.submit")}
        </Button>
        <p className="text-xs text-muted">{t.rich("signup.terms", { link: privacyLink })}</p>
      </div>
    </form>
  );
}

// ---------- Sign in ----------

export function LoginForm() {
  const t = useTranslations("account");
  const router = useRouter();
  const errorText = useErrorText();
  const { state, pending, onSubmit } = useSubmit(loginAction, () => {
    router.replace("/account");
    router.refresh();
  });
  const f = state.fields ?? {};
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <Field id="email" label={t("fields.email")} error={errorText(f.email)}>
        <input id="email" name="email" type="email" autoComplete="email" dir="ltr" className={inputClass} aria-invalid={!!f.email} required />
      </Field>
      <Field id="password" label={t("fields.password")} error={errorText(f.password)}>
        <PasswordInput id="password" autoComplete="current-password" invalid={!!f.password} />
      </Field>
      <div className="-mt-2 text-end text-sm">
        <Link href="/account/forgot" className="font-semibold text-primary">
          {t("login.forgot")}
        </Link>
      </div>
      <FormAlert state={state} />
      <Button type="submit" size="lg" icon="arrowRight" disabled={pending} className="w-full">
        {pending ? t("login.sending") : t("login.submit")}
      </Button>
    </form>
  );
}

// ---------- Forgot and reset password ----------

export function ForgotForm() {
  const t = useTranslations("account");
  const errorText = useErrorText();
  const { state, pending, onSubmit } = useSubmit(forgotPasswordAction);
  if (state.ok) {
    return (
      <div role="status" className="rounded-xl border border-success/40 bg-success/10 p-5 text-ink">
        <p className="font-semibold">{t("forgot.sentTitle")}</p>
        <p className="mt-1 text-sm text-muted">{t("forgot.sentBody")}</p>
      </div>
    );
  }
  const f = state.fields ?? {};
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <Field id="email" label={t("fields.email")} error={errorText(f.email)}>
        <input id="email" name="email" type="email" autoComplete="email" dir="ltr" className={inputClass} aria-invalid={!!f.email} required />
      </Field>
      <FormAlert state={state} />
      <Button type="submit" size="lg" icon="send" disabled={pending} className="w-full">
        {pending ? t("forgot.sending") : t("forgot.submit")}
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("account");
  const router = useRouter();
  const errorText = useErrorText();
  const { state, pending, onSubmit } = useSubmit(resetPasswordAction, () => {
    router.replace("/account");
    router.refresh();
  });
  const f = state.fields ?? {};
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      <Field id="password" label={t("reset.newPassword")} hint={t("fields.passwordHint", { min: PASSWORD_MIN })} error={errorText(f.password)}>
        <PasswordInput id="password" autoComplete="new-password" invalid={!!f.password} describedBy="password-hint" />
      </Field>
      <FormAlert state={state} />
      {state.error === "badLink" && (
        <Link href="/account/forgot" className="text-sm font-semibold text-primary">
          {t("reset.newLink")}
        </Link>
      )}
      <Button type="submit" size="lg" icon="check" disabled={pending} className="w-full">
        {pending ? t("reset.sending") : t("reset.submit")}
      </Button>
    </form>
  );
}

// ---------- My account ----------

export function ProfileForm({
  member,
}: {
  member: { name: string; phone: string | null; interests: string[]; marketingEmail: boolean; marketingWhatsapp: boolean };
}) {
  const t = useTranslations("account");
  const router = useRouter();
  const errorText = useErrorText();
  const { state, pending, onSubmit } = useSubmit(updateProfileAction, () => router.refresh());
  const f = state.fields ?? {};
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <Field id="name" label={t("fields.name")} error={errorText(f.name)} className="sm:col-span-2">
        <input id="name" name="name" autoComplete="name" defaultValue={member.name} className={inputClass} aria-invalid={!!f.name} required />
      </Field>
      <Field id="phone" label={t("fields.phone")} optionalLabel={t("fields.optional")} hint={t("fields.phoneHint")} error={errorText(f.phone)} className="sm:col-span-2">
        <PhoneInput initial={member.phone} invalid={!!f.phone} describedBy={f.phone ? "phone-error" : "phone-hint"} />
      </Field>
      <Interests initial={member.interests} />
      <MarketingChoices initial={{ email: member.marketingEmail, whatsapp: member.marketingWhatsapp }} phoneError={f.phone === "phoneForWhatsapp"} />
      <FormAlert state={state} />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" icon="check" disabled={pending}>
          {pending ? t("dashboard.saving") : t("dashboard.save")}
        </Button>
        {state.ok && !pending && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
            <Icon name="check" size={16} />
            {t("dashboard.saved")}
          </span>
        )}
      </div>
    </form>
  );
}

export function LogoutButton() {
  const t = useTranslations("account.dashboard");
  const router = useRouter();
  const { pending, onSubmit } = useSubmit(logoutAction, () => {
    router.replace("/");
    router.refresh();
  });
  return (
    <form onSubmit={onSubmit}>
      <Button type="submit" variant="secondary" disabled={pending}>
        {t("signOut")}
      </Button>
    </form>
  );
}

export function DeleteAccount() {
  const t = useTranslations("account.dashboard");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const { pending, onSubmit } = useSubmit(deleteAccountAction, () => {
    router.replace("/");
    router.refresh();
  });
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm font-semibold text-danger hover:underline">
        {t("deleteButton")}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger/5 p-4">
      <p className="text-sm text-ink">{t("deleteConfirmText")}</p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="h-10 rounded-full bg-danger px-5 text-sm font-semibold text-white disabled:opacity-60">
          {t("deleteConfirm")}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="h-10 rounded-full px-4 text-sm font-semibold text-muted hover:text-ink">
          {t("deleteCancel")}
        </button>
      </div>
    </form>
  );
}

// ---------- Unsubscribe ----------

export function UnsubscribeForm({ token }: { token: string }) {
  const t = useTranslations("account.unsubscribe");
  const { state, pending, onSubmit } = useSubmit(unsubscribeAction);
  if (state.ok) {
    return (
      <div role="status" className="rounded-xl border border-success/40 bg-success/10 p-5 text-ink">
        <p className="font-semibold">{t("doneTitle")}</p>
        <p className="mt-1 text-sm text-muted">{t("doneBody")}</p>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <FormAlert state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t("sending") : t("button")}
      </Button>
    </form>
  );
}
