import { and, eq, gt, inArray, lt, or } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { bookings, catalogItems, type Booking, type CatalogItem, type Customer, type Tenant } from "@/lib/db/schema";
import { shortCode } from "@/lib/money";
import { formatLagos, fromLagos, lagosWeekday, minutesOf, timeOfMinutes } from "@/lib/time";

const SLOT_STEP_MINUTES = 30;
/** Earliest a same-day booking can start. */
const LEAD_TIME_MS = 60 * 60 * 1000;
/** How long an unpaid booking holds its slot. */
export const UNPAID_HOLD_MS = 60 * 60 * 1000;
const MAX_DAYS_AHEAD = 60;

export class BookingError extends Error {}

/** Bookings that take up a slot: confirmed ones, and unpaid ones still inside their hold time. */
function activeOverlapping(db: Database, tenantId: string, start: Date, end: Date, now: Date) {
  return db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        lt(bookings.startsAt, end),
        gt(bookings.endsAt, start),
        or(
          eq(bookings.status, "confirmed"),
          and(eq(bookings.status, "pending_payment"), gt(bookings.createdAt, new Date(now.getTime() - UNPAID_HOLD_MS))),
        ),
      ),
    );
}

export async function getService(db: Database, tenant: Tenant, itemId: string): Promise<CatalogItem> {
  const item = await db.query.catalogItems.findFirst({
    where: and(eq(catalogItems.id, itemId), eq(catalogItems.tenantId, tenant.id)),
  });
  if (!item || item.kind !== "service" || !item.available) throw new BookingError("That service was not found or is not available.");
  return item;
}

/** Free start times ("10:30") for a service on a date (YYYY-MM-DD, Lagos time). */
export async function availableTimes(db: Database, tenant: Tenant, item: CatalogItem, date: string, now = new Date()) {
  const dayStart = fromLagos(date, "00:00");
  if (!dayStart) throw new BookingError("Use the date format YYYY-MM-DD.");
  if (dayStart.getTime() > now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
    throw new BookingError(`Bookings open at most ${MAX_DAYS_AHEAD} days ahead.`);
  }
  const hours = tenant.openingHours[lagosWeekday(fromLagos(date, "12:00")!)];
  if (!hours) return { open: false as const, times: [] as string[] };

  const duration = item.durationMinutes ?? 60;
  const open = minutesOf(hours[0]);
  const close = minutesOf(hours[1]);
  const times: string[] = [];
  for (let m = open; m + duration <= close; m += SLOT_STEP_MINUTES) {
    const start = fromLagos(date, timeOfMinutes(m))!;
    if (start.getTime() < now.getTime() + LEAD_TIME_MS) continue;
    const end = new Date(start.getTime() + duration * 60 * 1000);
    const taken = await activeOverlapping(db, tenant.id, start, end, now);
    if (taken.length < tenant.bookingCapacity) times.push(timeOfMinutes(m));
  }
  return { open: true as const, hours, times };
}

export function depositFor(tenant: Tenant, priceKobo: number) {
  if (tenant.bookingDepositPercent <= 0) return 0;
  // Round up to the nearest ₦100 so the amount looks tidy.
  return Math.ceil((priceKobo * tenant.bookingDepositPercent) / 100 / 10000) * 10000;
}

export async function createBooking(
  db: Database,
  tenant: Tenant,
  customer: Customer,
  input: { itemId: string; date: string; time: string; customerName: string; notes?: string },
  now = new Date(),
): Promise<Booking> {
  const item = await getService(db, tenant, input.itemId);
  const { times } = await availableTimes(db, tenant, item, input.date, now);
  if (!times.includes(input.time)) {
    throw new BookingError(
      times.length
        ? `${input.time} is not free on ${input.date}. Free times: ${times.join(", ")}.`
        : `There are no free times for ${item.name} on ${input.date}.`,
    );
  }
  const startsAt = fromLagos(input.date, input.time)!;
  const endsAt = new Date(startsAt.getTime() + (item.durationMinutes ?? 60) * 60 * 1000);
  const depositKobo = depositFor(tenant, item.priceKobo);
  const [booking] = await db
    .insert(bookings)
    .values({
      tenantId: tenant.id,
      customerId: customer.id,
      code: shortCode("BK"),
      itemId: item.id,
      serviceName: item.name,
      priceKobo: item.priceKobo,
      depositKobo,
      customerName: input.customerName.trim(),
      startsAt,
      endsAt,
      notes: input.notes?.trim() || null,
      status: depositKobo > 0 ? "pending_payment" : "confirmed",
      createdAt: now,
    })
    .returning();
  return booking;
}

export async function customerBookings(db: Database, customer: Customer) {
  return db.query.bookings.findMany({
    where: and(
      eq(bookings.customerId, customer.id),
      inArray(bookings.status, ["pending_payment", "confirmed"]),
    ),
    orderBy: (b, { asc }) => [asc(b.startsAt)],
  });
}

export function describeBooking(b: Booking) {
  return `${b.serviceName} on ${formatLagos(b.startsAt)} for ${b.customerName} (code ${b.code})`;
}
