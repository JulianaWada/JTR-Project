import { headers } from "next/headers";
import type { Currency } from "@/lib/db/schema";

/**
 * The visitor's country from Vercel's edge (ISO code such as "NG", "GB", "US"), or null when unknown
 * (local development, or a host that doesn't send it).
 */
export async function visitorCountry(): Promise<string | null> {
  const h = await headers();
  const code = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && code !== "XX" ? code : null;
}

/** Naira in Nigeria (and when we can't tell); dollars everywhere else, for courses that have a dollar price. */
export function currencyFor(country: string | null, course: { priceUsdCents: number | null }): Currency {
  return country && country !== "NG" && course.priceUsdCents ? "USD" : "NGN";
}

/** The course price a visitor from `country` sees, formatted. */
export function localPrice(country: string | null, course: { priceKobo: number; priceUsdCents: number | null }) {
  const currency = currencyFor(country, course);
  return { currency, minor: currency === "USD" ? course.priceUsdCents! : course.priceKobo };
}
