"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Icon } from "@/components/ui/Icon";
import { rememberCampaign } from "@/lib/members/campaign";
import { cn } from "@/lib/cn";

/** Set by the server when someone signs in (no secret in it), so pages can stay static. */
function signedIn() {
  return /(?:^|;\s*)jtr_member_in=1/.test(document.cookie);
}

/** "Sign in" or "My account" in the header. Also remembers campaign links (utm_*) for the sign-up form. */
export function AccountLink({ variant = "header" }: { variant?: "header" | "menu" }) {
  const t = useTranslations("account.nav");
  const pathname = usePathname();
  const [inside, setInside] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a browser cookie after navigation
    setInside(signedIn());
    if (variant === "header") rememberCampaign();
  }, [pathname, variant]);

  const href = inside ? "/account" : "/account/login";
  const label = inside ? t("myAccount") : t("signIn");
  if (variant === "menu") {
    return (
      <Link href={href} className="flex items-center gap-2 border-b border-line py-4 font-display text-xl font-medium text-ink">
        <Icon name="users" size={20} className="text-primary" />
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      aria-current={pathname.startsWith("/account") ? "page" : undefined}
      className={cn("inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink hover:bg-surface-2 hover:text-primary")}
    >
      <Icon name="users" size={18} />
      <span className="hidden md:inline">{label}</span>
      <span className="sr-only md:hidden">{label}</span>
    </Link>
  );
}
