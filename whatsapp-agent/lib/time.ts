import type { OpeningHours, WeekdayKey } from "@/lib/db/schema";

// Nigeria uses West Africa Time all year: UTC+1 with no daylight saving.
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
export const WEEKDAYS: WeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAY_NAMES: Record<WeekdayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** A shifted Date whose UTC fields read as Lagos wall-clock time. */
function lagos(date: Date) {
  return new Date(date.getTime() + LAGOS_OFFSET_MS);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-24" in Lagos. */
export function lagosDate(date: Date): string {
  const d = lagos(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** "14:30" in Lagos. */
export function lagosTime(date: Date): string {
  const d = lagos(date);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function lagosWeekday(date: Date): WeekdayKey {
  return WEEKDAYS[lagos(date).getUTCDay()];
}

/** Lagos wall-clock date + time to a real instant. Returns null for malformed input. */
export function fromLagos(dateStr: string, timeStr: string): Date | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const tm = /^(\d{1,2}):(\d{2})$/.exec(timeStr);
  if (!dm || !tm) return null;
  const [y, mo, d] = [Number(dm[1]), Number(dm[2]), Number(dm[3])];
  const [h, mi] = [Number(tm[1]), Number(tm[2])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const result = new Date(Date.UTC(y, mo - 1, d, h, mi) - LAGOS_OFFSET_MS);
  // Reject dates like 2026-02-31 that roll over into the next month.
  return lagosDate(result) === dateStr ? result : null;
}

export function addDays(dateStr: string, days: number): string {
  const base = fromLagos(dateStr, "12:00")!;
  return lagosDate(new Date(base.getTime() + days * 24 * 60 * 60 * 1000));
}

export function minutesOf(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function timeOfMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** "Saturday 24 October, 2:30pm" — the way the agent and messages show times. */
export function formatLagos(date: Date, opts: { withDate?: boolean } = { withDate: true }): string {
  const d = lagos(date);
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const time = `${h12}${minutes ? `:${pad(minutes)}` : ""}${hours < 12 ? "am" : "pm"}`;
  if (opts.withDate === false) return time;
  const month = d.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
  return `${WEEKDAY_NAMES[lagosWeekday(date)]} ${d.getUTCDate()} ${month}, ${time}`;
}

export function weekdayName(key: WeekdayKey) {
  return WEEKDAY_NAMES[key];
}

export function describeOpeningHours(hours: OpeningHours): string {
  const order: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return order
    .map((day) => {
      const slot = hours[day];
      return `${WEEKDAY_NAMES[day]}: ${slot ? `${slot[0]}–${slot[1]}` : "closed"}`;
    })
    .join("\n");
}
