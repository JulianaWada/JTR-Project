import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { NavLinks } from "./NavLinks";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const t = await getTranslations();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={t("a11y.home")} className="rounded-lg">
          <Logo alt={t("a11y.logoAlt")} size={38} />
        </Link>
        <nav aria-label={t("a11y.mainNav")} className="hidden lg:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <ButtonLink href="/contact" className="ms-2 hidden sm:inline-flex">
            {t("nav.startProject")}
          </ButtonLink>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
