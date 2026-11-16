import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { AuthShell } from "@/components/account/AuthShell";
import { SignupForm } from "@/components/account/AccountForms";
import { Icon, type IconName } from "@/components/ui/Icon";
import { getMember } from "@/lib/members/auth";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/signup">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return { title: t("signup"), description: t("signupDescription"), robots: { index: false, follow: true } };
}

export default async function SignupPage({ params }: PageProps<"/[locale]/account/signup">) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getMember()) redirect({ href: "/account", locale });
  const t = await getTranslations("account");
  const perks: { key: "updates" | "offers" | "academy"; icon: IconName }[] = [
    { key: "updates", icon: "bulb" },
    { key: "offers", icon: "star" },
    { key: "academy", icon: "edtech" },
  ];

  return (
    <AuthShell
      eyebrow={t("signup.eyebrow")}
      title={t("signup.title")}
      subtitle={t("signup.subtitle")}
      footer={t.rich("signup.haveAccount", {
        link: (chunks) => (
          <Link href="/account/login" className="font-semibold text-primary">
            {chunks}
          </Link>
        ),
      })}
      aside={
        <aside className="cut-corner rounded-ss-card bg-navy p-7 text-white lg:mt-24 dark:bg-surface-2">
          <h2 className="font-display text-xl font-semibold">{t("signup.perksTitle")}</h2>
          <ul className="mt-5 flex flex-col gap-5">
            {perks.map((p) => (
              <li key={p.key} className="flex items-start gap-3">
                <span className="inline-grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-[#6bb4ff]">
                  <Icon name={p.icon} size={20} />
                </span>
                <span>
                  <span className="block font-semibold">{t(`signup.perks.${p.key}.title`)}</span>
                  <span className="mt-1 block text-sm text-white/75">{t(`signup.perks.${p.key}.body`)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-white/15 pt-5 text-sm text-white/75">{t("signup.perksNote")}</p>
        </aside>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
