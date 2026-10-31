/** JTR Academy lives at /academy, served by its own app; links to it are plain <a> tags, not next-intl Links. */
export const academyNav = process.env.NEXT_PUBLIC_ACADEMY_ENABLED ? { key: "academy", href: "/academy" } : null;

export const mainNav = [
  { key: "about", href: "/about" },
  { key: "services", href: "/services" },
  { key: "projects", href: "/projects" },
  { key: "insights", href: "/insights" },
  { key: "careers", href: "/careers" },
  { key: "contact", href: "/contact" },
] as const;
