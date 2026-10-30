// Classes are scheduled on Lagos time (UTC+1, no daylight saving) and stored in UTC.

const TZ = "Africa/Lagos";

/** A UTC instant from a Lagos date ("2026-11-03") and time ("19:00"). */
export function fromLagos(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00+01:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026-11-03" and "19:00" in Lagos time, for form inputs. */
export function toLagosParts(d: Date): { date: string; time: string } {
  const lagos = new Date(d.getTime() + 60 * 60 * 1000);
  const iso = lagos.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date) {
  const date = d.toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
}

export function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}

export function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 86_400_000);
}
