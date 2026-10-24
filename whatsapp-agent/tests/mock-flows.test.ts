import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/lib/db";
import { bookings, customers, orders, payments } from "@/lib/db/schema";
import { markPaymentSuccessful } from "@/lib/payments";
import { at, customerSays, outbox, setup } from "./helpers";

// End-to-end flows through the offline demo brain: webhook message in, tools run, replies out.

let db: Database;
beforeEach(async () => {
  ({ db } = await setup());
});

describe("salon booking with the demo brain", () => {
  it("books, sends a deposit link and confirms after payment", async () => {
    const now = at("2026-10-24", "10:00"); // a Saturday
    const first = await customerSays(db, "salon", "Hi, I want to book knotless braids tomorrow at 2pm. My name is Ada Obi", { now });
    const booking = await db.query.bookings.findFirst({ where: eq(bookings.customerId, first.customerId!) });
    expect(booking?.status).toBe("pending_payment");
    expect(booking?.depositKobo).toBe(750000); // 30% of ₦25,000
    const sent = await outbox(db, first.customerId!);
    expect(sent.map((m) => m.author)).toEqual(["ai", "system"]);
    expect(sent[0].body).toContain("₦7,500");
    expect(sent[0].body).toContain("Privacy:");
    expect(sent[1].body).toContain("https://agent.test/pay/test/");

    const payment = await db.query.payments.findFirst({ where: eq(payments.bookingId, booking!.id) });
    await markPaymentSuccessful(db, payment!.reference, { now });
    const confirmed = await db.query.bookings.findFirst({ where: eq(bookings.id, booking!.id) });
    expect(confirmed?.status).toBe("confirmed");
    const after = await outbox(db, first.customerId!);
    expect(after.at(-1)?.body).toContain("is confirmed");

    // Paying twice changes nothing.
    expect((await markPaymentSuccessful(db, payment!.reference, { now })).alreadyHandled).toBe(true);
  });

  it("offers free times when only a day is given", async () => {
    const now = at("2026-10-24", "10:00");
    const r = await customerSays(db, "salon", "abeg I wan do cornrows on Monday", { now });
    const sent = await outbox(db, r.customerId!);
    expect(sent[0].body).toMatch(/Free times for Cornrows/);
    expect(sent[0].body).toContain("09:00");
  });
});

describe("food order with the demo brain", () => {
  it("takes a delivery order across two messages in Pidgin", async () => {
    const now = at("2026-10-24", "13:00");
    const from = "2348090000001";
    const r = await customerSays(db, "food", "abeg I wan order 2 jollof rice and one zobo", { now, from });
    let sent = await outbox(db, r.customerId!);
    expect(sent[0].body).toMatch(/deliver am or you go come pick up/);

    await customerSays(db, "food", "deliver to 5 Ahmadu Bello Way, Garki", { now: new Date(now.getTime() + 60_000), from });
    const order = await db.query.orders.findFirst({ where: eq(orders.customerId, r.customerId!) });
    expect(order?.totalKobo).toBe((2 * 4500 + 1000 + 1500) * 100);
    expect(order?.fulfilment).toBe("delivery");
    sent = await outbox(db, r.customerId!);
    expect(sent.at(-1)?.body).toContain("₦11,500");
  });

  it("refuses orders when the kitchen is closed", async () => {
    const sunday = at("2026-10-25", "13:00");
    const r = await customerSays(db, "food", "I want 1 fried rice for pickup", { now: sunday });
    const sent = await outbox(db, r.customerId!);
    expect(sent[0].body).toMatch(/closed/);
    expect(await db.query.orders.findFirst({ where: eq(orders.customerId, r.customerId!) })).toBeUndefined();
  });
});

describe("hand-over, opt-out and duplicates", () => {
  it("hands over to a person and stays quiet afterwards", async () => {
    const now = at("2026-10-24", "13:00");
    const r = await customerSays(db, "food", "I want to make a complaint about yesterday", { now });
    const c = await db.query.customers.findFirst({ where: eq(customers.id, r.customerId!) });
    expect(c?.mode).toBe("human");
    expect(c?.needsAttention).toBe(true);
    const before = (await outbox(db, r.customerId!)).length;
    await customerSays(db, "food", "hello??", { now: new Date(now.getTime() + 60_000) });
    expect((await outbox(db, r.customerId!)).length).toBe(before);
  });

  it("STOP opts the customer out", async () => {
    const now = at("2026-10-24", "13:00");
    const r = await customerSays(db, "salon", "STOP", { now });
    const c = await db.query.customers.findFirst({ where: eq(customers.id, r.customerId!) });
    expect(c?.optedOut).toBe(true);
  });
});
