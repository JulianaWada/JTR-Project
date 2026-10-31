/**
 * Structured site content. Words that visitors read live in /messages/*.json;
 * this file holds facts, links, IDs and placeholder data shared by every language.
 *
 * Every value marked TODO is a placeholder to replace before launch
 * (they are all listed in the README under "Placeholders").
 */

export const siteConfig = {
  name: "Jules TechRight",
  shortName: "JTR",
  legalName: "Jules TechRight (JTR) Ltd",
  // Canonical address for SEO. Set NEXT_PUBLIC_SITE_URL once the real domain is live; until then
  // Vercel's production address (e.g. jtr-project.vercel.app) is used, so links never point at a dead domain.
  // TODO: set NEXT_PUBLIC_SITE_URL to the production domain once it is registered.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://www.julestechright.com"),
  foundingCountry: "NG",
  headquarters: {
    // TODO: replace with the real office address.
    street: "TODO: Street address",
    city: "Lagos",
    region: "Lagos State",
    postalCode: "TODO",
    country: "Nigeria",
    countryCode: "NG",
  },
  contact: {
    // TODO: replace with the real contact email.
    email: "hello@julestechright.com",
    // TODO: replace with the real phone number (E.164 format).
    phone: "+234 000 000 0000",
    phoneHref: "tel:+2340000000000",
    // TODO: replace with the real WhatsApp number (digits only, with country code).
    whatsapp: "2340000000000",
    // TODO: replace with the real careers inbox.
    careersEmail: "careers@julestechright.com",
  },
  // TODO: replace with the real Cal.com booking link. Cal.com shows times in the visitor's time zone automatically.
  bookingUrl: "https://cal.com/julestechright/intro-call",
  // TODO: replace with a real Google Maps embed URL for the Lagos office.
  mapEmbedUrl: "",
  social: [
    // TODO: replace with real profile URLs (or delete the ones you don't use).
    { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/julestechright" },
    { id: "x", label: "X", href: "https://x.com/julestechright" },
    { id: "github", label: "GitHub", href: "https://github.com/julestechright" },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/julestechright" },
  ],
} as const;

export const serviceIds = [
  "websites",
  "mobile",
  "agentic-ai",
  "edtech",
  "digital-transformation",
] as const;
export type ServiceId = (typeof serviceIds)[number];

export const regionIds = [
  "africa",
  "europe",
  "north-america",
  "middle-east",
  "global",
] as const;
export type RegionId = (typeof regionIds)[number];

/**
 * Global reach figures shown on Home and About.
 * TODO: replace every value with real figures before launch.
 */
export const reachFigures = [
  { id: "countries", value: 12, suffix: "+" },
  { id: "timezones", value: 9, suffix: "" },
  { id: "response", value: 24, suffix: "h" },
] as const;

/** Time zones the team covers, shown in the Global reach section. */
export const timeZoneCoverage = [
  { city: "lagos", tz: "Africa/Lagos" },
  { city: "london", tz: "Europe/London" },
  { city: "dubai", tz: "Asia/Dubai" },
  { city: "newYork", tz: "America/New_York" },
] as const;

/**
 * Portfolio entries. Titles, summaries and image descriptions are in messages under "projects.items.<id>".
 * Only real work goes here: no invented clients or results. Mark unfinished work as "in-progress".
 */
export const projectStatuses = ["live", "in-progress"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const projects: {
  id: string;
  service: ServiceId;
  region: RegionId;
  year: number;
  status: ProjectStatus;
  /** Screenshot in /public/projects (16:10 works best). Without one, the card shows abstract artwork. */
  image?: string;
  /** Public link to the project, if there is one. */
  href?: string;
  featured?: boolean;
}[] = [
  {
    id: "whatsapp-sales-agent",
    service: "agentic-ai",
    region: "africa",
    year: 2026,
    status: "in-progress",
    image: "/projects/whatsapp-sales-agent.webp",
    featured: true,
  },
  {
    id: "jtr-website",
    service: "websites",
    region: "global",
    year: 2026,
    status: "live",
    image: "/projects/jtr-website.webp",
    featured: true,
  },
  {
    id: "ufedo",
    service: "websites",
    region: "africa",
    year: 2026,
    status: "live",
    href: "https://ufedo.app/",
  },
];

export const valueIds = [
  "innovation",
  "accessibility",
  "impact",
  "integrity",
  "excellence",
] as const;

export const budgetRanges = [
  "under-10k",
  "10k-25k",
  "25k-50k",
  "50k-100k",
  "over-100k",
  "not-sure",
] as const;

/** Budget brackets in USD; other currencies are converted roughly for display only. */
export const budgetBrackets: Record<(typeof budgetRanges)[number], [number, number] | null> = {
  "under-10k": [0, 10000],
  "10k-25k": [10000, 25000],
  "25k-50k": [25000, 50000],
  "50k-100k": [50000, 100000],
  "over-100k": [100000, Infinity],
  "not-sure": null,
};

export const currencies = ["USD", "EUR", "GBP", "NGN", "AED", "CAD", "ZAR"] as const;

/**
 * Rough USD exchange rates, used only to show budget ranges in the visitor's chosen currency.
 * TODO: review these occasionally; they are display hints, not quotes.
 */
export const approxUsdRates: Record<(typeof currencies)[number], number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  NGN: 1500,
  AED: 3.67,
  CAD: 1.37,
  ZAR: 18,
};
