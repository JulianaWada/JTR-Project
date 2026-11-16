import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthShell } from "@/components/account/AuthShell";
import { ForgotForm } from "@/components/account/AccountForms";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/forgot">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return { title: t("forgot"), robots: { index: false, follow: false } };
}

export default async function ForgotPage({ params }: PageProps<"/[locale]/account/forgot">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  return (
    <AuthShell
      eyebrow={t("login.eyebrow")}
      title={t("forgot.title")}
      subtitle={t("forgot.subtitle")}
      footer={
        <Link href="/account/login" className="font-semibold text-primary">
          {t("forgot.back")}
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
