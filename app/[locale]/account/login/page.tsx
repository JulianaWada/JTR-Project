import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { AuthShell } from "@/components/account/AuthShell";
import { LoginForm } from "@/components/account/AccountForms";
import { getMember } from "@/lib/members/auth";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return { title: t("login"), robots: { index: false, follow: true } };
}

export default async function LoginPage({ params }: PageProps<"/[locale]/account/login">) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getMember()) redirect({ href: "/account", locale });
  const t = await getTranslations("account");
  return (
    <AuthShell
      eyebrow={t("login.eyebrow")}
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footer={t.rich("login.noAccount", {
        link: (chunks) => (
          <Link href="/account/signup" className="font-semibold text-primary">
            {chunks}
          </Link>
        ),
      })}
    >
      <LoginForm />
    </AuthShell>
  );
}
