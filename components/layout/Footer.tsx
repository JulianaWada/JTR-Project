import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { serviceIds, siteConfig } from "@/content/site";
import { CookieSettingsButton } from "./CookieSettingsButton";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();

  const companyLinks = [
    { href: "/about", label: t("nav.about") },
    { href: "/projects", label: t("nav.projects") },
    { href: "/insights", label: t("nav.insights") },
    { href: "/careers", label: t("nav.careers") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/assistant", label: t("nav.assistant") },
  ];

  return (
    <footer className="dark border-t border-line bg-navy text-ink">
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo alt={t("a11y.logoAlt")} size={44} />
          <p className="mt-5 text-muted">{t("footer.tagline")}</p>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Icon name="globe" size={16} className="text-primary" />
            {t("footer.hq")}
          </p>
          <ul className="mt-6 flex gap-2" aria-label={t("footer.connect")}>
            {siteConfig.social.map((s) => (
              <li key={s.id}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-grid size-10 place-items-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name={s.id as IconName} size={18} />
                  <span className="sr-only">
                    {s.label} {t("a11y.opensInNewTab")}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={t("footer.services")}>
          <h2 className="text-sm font-semibold tracking-wide text-silver uppercase">{t("footer.services")}</h2>
          <ul className="mt-4 space-y-3">
            {serviceIds.map((id) => (
              <li key={id}>
                <Link href={`/services#${id}`} className="text-muted transition-colors hover:text-primary">
                  {t(`services.${id}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("footer.company")}>
          <h2 className="text-sm font-semibold tracking-wide text-silver uppercase">{t("footer.company")}</h2>
          <ul className="mt-4 space-y-3">
            {companyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold tracking-wide text-silver uppercase">{t("nav.contact")}</h2>
          <ul className="mt-4 space-y-3 text-muted">
            <li>
              <a href={`mailto:${siteConfig.contact.email}`} className="transition-colors hover:text-primary">
                {siteConfig.contact.email}
              </a>
            </li>
            <li>
              <a href={siteConfig.contact.phoneHref} className="transition-colors hover:text-primary" dir="ltr">
                {siteConfig.contact.phone}
              </a>
            </li>
            <li>
              <a href={siteConfig.bookingUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                {t("nav.bookCall")}
                <span className="sr-only"> {t("a11y.opensInNewTab")}</span>
              </a>
            </li>
          </ul>
          <h2 className="mt-8 text-sm font-semibold tracking-wide text-silver uppercase">{t("footer.legal")}</h2>
          <ul className="mt-4 space-y-3 text-muted">
            <li>
              <Link href="/privacy" className="transition-colors hover:text-primary">
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-primary">
                {t("footer.terms")}
              </Link>
            </li>
            <li>
              <CookieSettingsButton />
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-line">
        <Container className="py-6 text-sm text-muted">
          <p>{t("footer.rights", { year })}</p>
        </Container>
      </div>
    </footer>
  );
}
