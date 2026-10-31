/** ₦12,500 from 1250000 kobo. Kobo are shown only when present. */
export function naira(kobo: number): string {
  const value = kobo / 100;
  const hasKobo = kobo % 100 !== 0;
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: hasKobo ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function koboFromNaira(value: number): number {
  return Math.round(value * 100);
}

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O or 1/I/L

/** Short human-friendly code such as "BK-7K3F". */
export function shortCode(prefix: string, length = 5): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `${prefix}-${out}`;
}
