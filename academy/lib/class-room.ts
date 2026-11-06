// The JTR class room: a private video room for each live intake, shown inside the academy.
// Video runs on Daily (daily.co). The academy creates the room and a personal pass for each person who joins,
// so only paid students of that intake (and Jules) can get in. Without DAILY_API_KEY it runs in test mode.

import { env } from "@/lib/env";
import { addMinutes } from "@/lib/time";

const DAILY_API = "https://api.daily.co/v1";

/** How early students can enter, and how long after the start a join still counts as attendance. */
export const OPENS_MINUTES_BEFORE = 30;

export type RoomMode = "jtr" | "link";

/** Whether an intake meets in the JTR class room (the default) or on an outside link such as Google Meet. */
export function usesJtrRoom(cohort: { room: string }) {
  return cohort.room !== "link";
}

/** The outside link a class uses, or "" when it meets in the JTR class room. */
export function outsideLink(cohort: { room: string; meetUrl: string }, lesson?: { meetUrl: string | null }) {
  if (usesJtrRoom(cohort)) return "";
  return lesson?.meetUrl || cohort.meetUrl;
}

/** Whether an intake still needs something from Jules before its classes can happen. */
export function needsLink(cohort: { room: string; meetUrl: string }) {
  return !usesJtrRoom(cohort) && !cohort.meetUrl;
}

/** One room per intake, so everyone in it meets in the same place every class. */
export function roomName(cohortId: string) {
  return `jtr-class-${cohortId}`;
}

type Lesson = { id: string; startsAt: Date; durationMinutes: number };

/** The class a student may be in right now: from 30 minutes before it starts until it ends. */
export function openClass<T extends Lesson>(lessons: T[], now = new Date()): T | undefined {
  return lessons.find((l) => now >= addMinutes(l.startsAt, -OPENS_MINUTES_BEFORE) && now <= addMinutes(l.startsAt, l.durationMinutes));
}

export type RoomPass =
  | { mode: "live"; url: string }
  | { mode: "test" }
  | { mode: "error"; message: string };

async function daily(path: string, init?: RequestInit) {
  return fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.dailyApiKey}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
}

/** Finds the intake's room on Daily, creating it the first time. Private: nobody gets in without a pass from the academy. */
async function ensureRoom(name: string): Promise<string> {
  const found = await daily(`/rooms/${name}`);
  if (found.ok) return ((await found.json()) as { url: string }).url;
  if (found.status !== 404) throw new Error(`Daily rooms lookup failed (${found.status})`);
  const created = await daily("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name,
      privacy: "private",
      properties: { enable_chat: true, enable_screenshare: true, enable_prejoin_ui: true, enable_knocking: false, lang: "en" },
    }),
  });
  if (!created.ok) throw new Error(`Daily couldn't create the room (${created.status})`);
  return ((await created.json()) as { url: string }).url;
}

/**
 * A personal pass into the intake's room. Jules is the host (can mute or remove people and record);
 * students show up with their own name. The pass stops working an hour after `until`.
 */
export async function roomPass(opts: { cohortId: string; user: { id: string; name: string }; host: boolean; until: Date }): Promise<RoomPass> {
  if (!env.dailyApiKey) return { mode: "test" };
  try {
    const name = roomName(opts.cohortId);
    const roomUrl = await ensureRoom(name);
    const res = await daily("/meeting-tokens", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          room_name: name,
          user_name: opts.user.name,
          user_id: opts.user.id,
          is_owner: opts.host,
          exp: Math.floor(addMinutes(opts.until, 60).getTime() / 1000),
        },
      }),
    });
    if (!res.ok) throw new Error(`Daily couldn't make a pass (${res.status})`);
    const { token } = (await res.json()) as { token: string };
    return { mode: "live", url: `${roomUrl}?t=${encodeURIComponent(token)}` };
  } catch (err) {
    console.error("[class-room]", err);
    return { mode: "error", message: "The class room couldn't open just now. Please reload the page in a moment." };
  }
}
