/**
 * JTR Academy is its own app, at /academy on this site or on its own subdomain (see next.config.ts), so links to it
 * are plain <a> tags, not next-intl Links.
 */
export const academyNav = process.env.NEXT_PUBLIC_ACADEMY_ENABLED
  ? { key: "academy", href: process.env.NEXT_PUBLIC_ACADEMY_HREF || "/academy" }
  : null;

export const mainNav = [
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "projects", href: "/projects" },
  { key: "insights", href: "/insights" },
  { key: "careers", href: "/careers" },
  { key: "contact", href: "/contact" },
] as const;
