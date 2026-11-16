import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { DeleteAccount, LogoutButton, ProfileForm } from "@/components/account/AccountForms";
import { getMember } from "@/lib/members/auth";

export async function generateMetadata({ params }: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return { title: t("account"), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params, searchParams }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const member = await getMember();
  if (!member) return redirect({ href: "/account/login", locale });
  const welcome = (await searchParams).welcome === "1";
  const t = await getTranslations("account.dashboard");
  const format = await getFormatter();

  return (
    <section aria-labelledby="page-title">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <h1 id="page-title" className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {t("title", { name: member.name.split(" ")[0] })}
              </h1>
              <p className="mt-2 text-muted">
                <span dir="ltr">{member.email}</span> · {t("memberSince", { date: format.dateTime(member.createdAt, { dateStyle: "long" }) })}
              </p>
            </div>
            <LogoutButton />
          </div>

          {welcome && (
            <div role="status" className="mt-8 flex items-start gap-3 rounded-card border border-success/40 bg-success/10 p-5">
              <span className="inline-grid size-9 shrink-0 place-items-center rounded-full bg-success/20 text-success">
                <Icon name="check" size={18} />
              </span>
              <div>
                <p className="font-semibold text-ink">{t("welcomeTitle")}</p>
                <p className="mt-1 text-sm text-muted">{t("welcomeBody")}</p>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-card border border-line bg-surface p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink">{t("profileTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("profileIntro")}</p>
              <div className="mt-6">
                <ProfileForm
                  member={{
                    name: member.name,
                    phone: member.phone,
                    interests: member.interests,
                    marketingEmail: member.marketingEmail,
                    marketingWhatsapp: member.marketingWhatsapp,
                  }}
                />
              </div>
            </div>
            <aside className="flex flex-col gap-6">
              <div className="rounded-card border border-line bg-surface p-6">
                <h2 className="font-display text-lg font-semibold text-ink">{t("statusTitle")}</h2>
                <ul className="mt-4 flex flex-col gap-3 text-sm">
                  {(["marketingEmail", "marketingWhatsapp"] as const).map((k) => (
                    <li key={k} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-ink">
                        <Icon name={k === "marketingEmail" ? "mail" : "whatsapp"} size={18} className="text-primary" />
                        {t(k)}
                      </span>
                      <span className={member[k] ? "font-semibold text-success" : "text-muted"}>{member[k] ? t("on") : t("off")}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-card border border-line bg-surface p-6">
                <h2 className="font-display text-lg font-semibold text-ink">{t("deleteTitle")}</h2>
                <p className="mt-1 mb-4 text-sm text-muted">{t("deleteBody")}</p>
                <DeleteAccount />
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </section>
  );
}
