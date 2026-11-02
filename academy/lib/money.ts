/** ₦50,000 from 5000000 kobo. Kobo are shown only when present. */
export function naira(kobo: number): string {
  const value = kobo / 100;
  const hasKobo = kobo % 100 !== 0;
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** $35 from 3500 cents. Cents are shown only when present. */
export function usd(cents: number): string {
  const hasCents = cents % 100 !== 0;
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/** An amount in its currency's smallest unit (kobo or cents), formatted for display. */
export function money(minor: number, currency: "NGN" | "USD" = "NGN"): string {
  return currency === "USD" ? usd(minor) : naira(minor);
}

export function koboFromNaira(value: number): number {
  return Math.round(value * 100);
}

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O or 1/I/L

/** Short human-friendly code such as "JTR-7K3F9". */
export function shortCode(prefix: string, length = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `${prefix}-${out}`;
}
