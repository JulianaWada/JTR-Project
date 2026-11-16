import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthShell } from "@/components/account/AuthShell";
import { UnsubscribeForm } from "@/components/account/AccountForms";

export async function generateMetadata({ params }: PageProps<"/[locale]/unsubscribe">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return { title: t("unsubscribe"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

/** The link at the bottom of marketing emails. It asks for one click, so email scanners that open links don't unsubscribe people. */
export default async function UnsubscribePage({ params, searchParams }: PageProps<"/[locale]/unsubscribe">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const token = (await searchParams).token;
  const t = await getTranslations("account.unsubscribe");
  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("subtitle")}
      footer={t.rich("manage", {
        link: (chunks) => (
          <Link href="/account" className="font-semibold text-primary">
            {chunks}
          </Link>
        ),
      })}
    >
      <UnsubscribeForm token={typeof token === "string" ? token : ""} />
    </AuthShell>
  );
}
