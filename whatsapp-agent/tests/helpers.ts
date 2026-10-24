import { asc, eq } from "drizzle-orm";
import { createInMemoryDb, type Database } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { handleInbound } from "@/lib/inbound";
import { DEMO_FOOD_PHONE_ID, DEMO_SALON_PHONE_ID, seedDemoTenants } from "@/lib/seed";
import { fromLagos } from "@/lib/time";

export async function setup() {
  const db = await createInMemoryDb();
  const { salon, kitchen } = await seedDemoTenants(db, "test-password");
  return { db, salon, kitchen };
}

/** A fixed Lagos time, e.g. at("2026-10-24", "14:00"). */
export function at(date: string, time: string) {
  return fromLagos(date, time)!;
}

let counter = 0;
export async function customerSays(
  db: Database,
  business: "salon" | "food",
  text: string,
  opts: { from?: string; now: Date },
) {
  return handleInbound(
    db,
    {
      phoneNumberId: business === "salon" ? DEMO_SALON_PHONE_ID : DEMO_FOOD_PHONE_ID,
      from: opts.from ?? "2348031234567",
      profileName: "Ada",
      id: `wamid.test.${counter++}`,
      timestamp: opts.now,
      text,
      readable: true,
    },
    { now: () => opts.now },
  );
}

export async function outbox(db: Database, customerId: string) {
  const rows = await db.query.messages.findMany({
    where: eq(messages.customerId, customerId),
    orderBy: [asc(messages.createdAt)],
  });
  return rows.filter((r) => r.direction === "out");
}
