import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { catalogItems, orders, type Customer, type Order, type OrderLine, type Tenant } from "@/lib/db/schema";
import { naira, shortCode } from "@/lib/money";
import { formatLagos, lagosTime, lagosWeekday, minutesOf } from "@/lib/time";

export class OrderError extends Error {}

const MAX_QUANTITY = 50;

export function isOpenNow(tenant: Tenant, now = new Date()) {
  const hours = tenant.openingHours[lagosWeekday(now)];
  if (!hours) return false;
  const current = minutesOf(lagosTime(now));
  return current >= minutesOf(hours[0]) && current < minutesOf(hours[1]);
}

export async function createOrder(
  db: Database,
  tenant: Tenant,
  customer: Customer,
  input: {
    items: { itemId: string; quantity: number }[];
    fulfilment: "delivery" | "pickup";
    deliveryAddress?: string;
    notes?: string;
  },
  now = new Date(),
): Promise<Order> {
  if (!input.items.length) throw new OrderError("The order has no items.");
  if (!isOpenNow(tenant, now)) throw new OrderError("The kitchen is closed right now, so orders can't be taken.");
  if (input.fulfilment === "delivery" && !tenant.offersDelivery) throw new OrderError("This business does not deliver.");
  if (input.fulfilment === "pickup" && !tenant.offersPickup) throw new OrderError("This business does not offer pickup.");
  if (input.fulfilment === "delivery" && !input.deliveryAddress?.trim()) {
    throw new OrderError("A delivery address is needed for delivery orders.");
  }

  const ids = [...new Set(input.items.map((i) => i.itemId))];
  const found = await db.query.catalogItems.findMany({
    where: and(eq(catalogItems.tenantId, tenant.id), inArray(catalogItems.id, ids)),
  });
  const byId = new Map(found.map((f) => [f.id, f]));

  const lines: OrderLine[] = [];
  for (const { itemId, quantity } of input.items) {
    const item = byId.get(itemId);
    if (!item || item.kind !== "product") throw new OrderError(`Item ${itemId} is not on the menu.`);
    if (!item.available) throw new OrderError(`${item.name} is sold out right now.`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new OrderError(`Quantity for ${item.name} must be a whole number from 1 to ${MAX_QUANTITY}.`);
    }
    const existing = lines.find((l) => l.itemId === itemId);
    if (existing) existing.quantity += quantity;
    else lines.push({ itemId, name: item.name, quantity, unitPriceKobo: item.priceKobo });
  }

  const subtotalKobo = lines.reduce((sum, l) => sum + l.quantity * l.unitPriceKobo, 0);
  const deliveryFeeKobo = input.fulfilment === "delivery" ? tenant.deliveryFeeKobo : 0;
  const [order] = await db
    .insert(orders)
    .values({
      tenantId: tenant.id,
      customerId: customer.id,
      code: shortCode("OR"),
      lines,
      subtotalKobo,
      deliveryFeeKobo,
      totalKobo: subtotalKobo + deliveryFeeKobo,
      fulfilment: input.fulfilment,
      deliveryAddress: input.fulfilment === "delivery" ? input.deliveryAddress!.trim() : null,
      notes: input.notes?.trim() || null,
      status: "awaiting_payment",
      createdAt: now,
    })
    .returning();
  return order;
}

export function describeOrder(o: Order) {
  const items = o.lines.map((l) => `${l.quantity} x ${l.name}`).join(", ");
  const delivery = o.fulfilment === "delivery" ? ` + ${naira(o.deliveryFeeKobo)} delivery to ${o.deliveryAddress}` : " (pickup)";
  return `${items}${delivery}. Total ${naira(o.totalKobo)}. Code ${o.code}, placed ${formatLagos(o.createdAt)}, status ${o.status.replaceAll("_", " ")}`;
}

export async function customerOrders(db: Database, customer: Customer) {
  return db.query.orders.findMany({
    where: eq(orders.customerId, customer.id),
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    limit: 5,
  });
}

/** What the customer is told when the owner moves an order along in the dashboard. */
export const ORDER_STATUS_MESSAGES: Partial<Record<Order["status"], (o: Order, t: Tenant) => string>> = {
  preparing: (o) => `Your order ${o.code} is being prepared now. 🍲`,
  ready: (o) => `Your order ${o.code} is ready for pickup.`,
  out_for_delivery: (o) => `Your order ${o.code} is on its way to ${o.deliveryAddress}. 🛵`,
  completed: (o, t) => `Order ${o.code} is complete. Thank you for ordering from ${t.name}!`,
  cancelled: (o) => `Your order ${o.code} has been cancelled. If you paid, the business will contact you about a refund.`,
};
