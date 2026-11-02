const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

/** Formats kobo (1 naira = 100 kobo) as naira. */
export function formatNaira(kobo: number) {
  return naira.format(Math.round(kobo / 100));
}

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 });

/** An amount in its currency's smallest unit (kobo or cents). Academy payments can be in US dollars. */
export function formatMoney(minor: number, currency: "NGN" | "USD" = "NGN") {
  return currency === "USD" ? dollars.format(minor / 100) : formatNaira(minor);
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});
const dateOnly = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });

/** Dates are shown on Lagos time. */
export function formatDateTime(d: Date | string | null | undefined) {
  return d ? dateTime.format(new Date(d)) : "";
}

export function formatDate(d: Date | string | null | undefined) {
  return d ? dateOnly.format(new Date(d)) : "";
}
