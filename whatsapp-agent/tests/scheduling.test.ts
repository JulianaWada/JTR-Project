import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { availableTimes, createBooking } from "@/lib/bookings";
import type { Database } from "@/lib/db";
import { bookings, catalogItems, customers, payments, type Tenant } from "@/lib/db/schema";
import { getPaymentLink } from "@/lib/payments";
import { runReminders } from "@/lib/reminders";
import { formatLagos, fromLagos } from "@/lib/time";
import { at, outbox, setup } from "./helpers";

let db: Database;
let salon: Tenant;
beforeEach(async () => {
  ({ db, salon } = await setup());
});

async function newCustomer(waId: string) {
  const [c] = await db.insert(customers).values({ tenantId: salon.id, waId, lastInboundAt: at("2026-10-20", "12:00") }).returning();
  return c;
}

describe("time helpers", () => {
  it("uses Lagos time (UTC+1)", () => {
    expect(fromLagos("2026-10-25", "14:00")!.toISOString()).toBe("2026-10-25T13:00:00.000Z");
    expect(fromLagos("2026-02-31", "10:00")).toBeNull();
    expect(formatLagos(fromLagos("2026-10-25", "14:30")!)).toBe("Sunday 25 October, 2:30pm");
  });
});

describe("availability", () => {
  it("respects opening hours, lead time and capacity", async () => {
    const cornrows = (await db.query.catalogItems.findFirst({ where: eq(catalogItems.name, "Cornrows (straight back)") }))!;
    const now = at("2026-10-26", "09:10"); // Monday
    const { times } = await availableTimes(db, salon, cornrows, "2026-10-26", now);
    expect(times[0]).toBe("10:30"); // 09:10 + 1 hour lead time, on the half hour
    expect(times.at(-1)).toBe("17:30"); // 90 minutes before 19:00 closing

    // Capacity is 3: after three bookings at 11:00, 11:00 is gone (and overlapping slots too).
    salon.bookingDepositPercent = 0;
    for (let i = 0; i < 3; i++) {
      const c = await newCustomer(`23480000000${i}`);
      await createBooking(db, salon, c, { itemId: cornrows.id, date: "2026-10-26", time: "11:00", customerName: `C${i}` }, now);
    }
    const after = await availableTimes(db, salon, cornrows, "2026-10-26", now);
    expect(after.times).not.toContain("11:00");
    expect(after.times).not.toContain("12:00");
    expect(after.times).toContain("12:30");
  });
});

describe("reminders cron", () => {
  it("sends a day-before and a same-day reminder once each, and releases unpaid holds", async () => {
    const braids = (await db.query.catalogItems.findFirst({ where: eq(catalogItems.name, "Knotless braids (mid-back)") }))!;
    const ada = await newCustomer("2348011111111");
    const created = at("2026-10-20", "12:00");
    const booking = await createBooking(db, salon, ada, { itemId: braids.id, date: "2026-10-25", time: "14:00", customerName: "Ada" }, created);
    await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, booking.id));

    const unpaidCustomer = await newCustomer("2348022222222");
    const unpaid = await createBooking(db, salon, unpaidCustomer, { itemId: braids.id, date: "2026-10-27", time: "10:00", customerName: "Bola" }, at("2026-10-24", "09:00"));
    await getPaymentLink(db, salon, unpaidCustomer, { booking: unpaid });

    const dayBefore = await runReminders(db, at("2026-10-24", "15:00"));
    expect(dayBefore).toMatchObject({ dayBefore: 1, sameDay: 0, bookingsExpired: 1 });
    // Ada last wrote days ago, so WhatsApp needs a template: in test mode it is recorded as simulated.
    const adaMessages = await outbox(db, ada.id);
    expect(adaMessages[0].body).toContain("reminder of your Knotless braids");
    expect(adaMessages[0].status).toBe("simulated");
    expect((await db.query.payments.findFirst({ where: eq(payments.bookingId, unpaid.id) }))?.status).toBe("abandoned");

    expect(await runReminders(db, at("2026-10-24", "15:15"))).toMatchObject({ dayBefore: 0, sameDay: 0 });
    expect(await runReminders(db, at("2026-10-25", "12:30"))).toMatchObject({ dayBefore: 0, sameDay: 1 });
    expect(await runReminders(db, at("2026-10-25", "12:45"))).toMatchObject({ sameDay: 0 });
  });

  it("skips customers who replied STOP", async () => {
    const braids = (await db.query.catalogItems.findFirst({ where: eq(catalogItems.name, "Knotless braids (mid-back)") }))!;
    const c = await newCustomer("2348033333333");
    await db.update(customers).set({ optedOut: true }).where(eq(customers.id, c.id));
    const b = await createBooking(db, salon, c, { itemId: braids.id, date: "2026-10-25", time: "14:00", customerName: "Chi" }, at("2026-10-20", "12:00"));
    await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, b.id));
    await runReminders(db, at("2026-10-24", "15:00"));
    expect(await outbox(db, c.id)).toHaveLength(0);
  });
});
