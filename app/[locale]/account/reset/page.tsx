import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/account/AuthShell";
import { ResetForm } from "@/components/account/AccountForms";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/reset">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return { title: t("reset"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

export default async function ResetPage({ params, searchParams }: PageProps<"/[locale]/account/reset">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const token = (await searchParams).token;
  const t = await getTranslations("account");
  return (
    <AuthShell eyebrow={t("login.eyebrow")} title={t("reset.title")} subtitle={t("reset.subtitle")}>
      <ResetForm token={typeof token === "string" ? token : ""} />
    </AuthShell>
  );
}
