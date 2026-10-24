import { count } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { catalogItems, tenants, type OpeningHours } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { koboFromNaira } from "@/lib/money";
import { hashPassword } from "@/lib/passwords";

// Two made-up Abuja businesses for demos: a salon (bookings) and a food vendor (orders).
// Prices are illustrative, not market research.

export const DEMO_SALON_PHONE_ID = "demo-salon";
export const DEMO_FOOD_PHONE_ID = "demo-food";

const salonHours: OpeningHours = {
  mon: ["09:00", "19:00"],
  tue: ["09:00", "19:00"],
  wed: ["09:00", "19:00"],
  thu: ["09:00", "19:00"],
  fri: ["09:00", "20:00"],
  sat: ["08:00", "20:00"],
  sun: ["13:00", "18:00"],
};

const kitchenHours: OpeningHours = {
  mon: ["10:00", "21:00"],
  tue: ["10:00", "21:00"],
  wed: ["10:00", "21:00"],
  thu: ["10:00", "21:00"],
  fri: ["10:00", "22:00"],
  sat: ["11:00", "22:00"],
  sun: null,
};

export async function seedDemoTenants(db: Database, password: string) {
  const passwordHash = hashPassword(password);
  const [salon] = await db
    .insert(tenants)
    .values({
      slug: "glow-up-studio",
      name: "Glow Up Studio",
      kind: "salon",
      whatsappPhoneNumberId: DEMO_SALON_PHONE_ID,
      whatsappDisplayNumber: "+234 800 000 0001",
      address: "Plot 12, Aminu Kano Crescent, Wuse 2, Abuja (opposite the Banex Plaza junction)",
      info: [
        "Unisex hair and beauty salon. Walk-ins welcome but booking is recommended, especially on Saturdays.",
        "Braiding hair (attachment) is not included in braid prices; customers can bring their own or buy at the salon from ₦4,000.",
        "A 30% deposit secures a booking. It is deducted from the final bill. Cancel at least 24 hours before to get the deposit back.",
        "Free parking in front of the building. Card, transfer and cash accepted at the salon.",
      ].join("\n"),
      openingHours: salonHours,
      bookingCapacity: 3,
      bookingDepositPercent: 30,
      offersDelivery: false,
      offersPickup: false,
      dashboardPasswordHash: passwordHash,
    })
    .returning();

  await db.insert(catalogItems).values(
    [
      ["Knotless braids (mid-back)", "Includes wash and blow-dry before braiding", 25000, 240],
      ["Cornrows (straight back)", "Natural hair, no extensions", 8000, 90],
      ["Wash and set", "Shampoo, condition and roller set", 6000, 60],
      ["Silk press", "For natural hair; includes wash and treatment", 12000, 90],
      ["Wig install (frontal)", "Customer brings the wig; includes styling", 15000, 120],
      ["Men's haircut", "Clipper cut with beard line-up", 5000, 30],
      ["Manicure", "Shape, cuticle care and gel polish", 7000, 45],
      ["Pedicure", "Soak, scrub and gel polish", 9000, 60],
    ].map(([name, description, price, duration], i) => ({
      tenantId: salon.id,
      kind: "service" as const,
      name: name as string,
      description: description as string,
      priceKobo: koboFromNaira(price as number),
      durationMinutes: duration as number,
      sortOrder: i,
    })),
  );

  const [kitchen] = await db
    .insert(tenants)
    .values({
      slug: "mama-nkechi-kitchen",
      name: "Mama Nkechi's Kitchen",
      kind: "food",
      whatsappPhoneNumberId: DEMO_FOOD_PHONE_ID,
      whatsappDisplayNumber: "+234 800 000 0002",
      address: "Shop 4, Area 11 Shopping Complex, Garki, Abuja",
      info: [
        "Home-style Nigerian food, cooked fresh daily.",
        "Delivery covers Garki, Area 1 to 11, Wuse, Asokoro and Maitama. Delivery takes 45 to 75 minutes after payment.",
        "Pickup orders are ready in about 30 minutes.",
        "Orders are only prepared after payment is confirmed.",
        "We cook with groundnut oil. Tell us about any allergies and we will advise.",
      ].join("\n"),
      openingHours: kitchenHours,
      deliveryFeeKobo: koboFromNaira(1500),
      offersDelivery: true,
      offersPickup: true,
      dashboardPasswordHash: passwordHash,
    })
    .returning();

  await db.insert(catalogItems).values(
    [
      ["Jollof rice and chicken", "Smoky party jollof with fried plantain and one piece of chicken", 4500],
      ["Fried rice and turkey", "With coleslaw and one piece of turkey", 6000],
      ["Pounded yam and egusi", "Egusi soup with assorted meat", 5500],
      ["Amala and ewedu", "With gbegiri and beef stew", 4000],
      ["Small chops platter", "Puff-puff, samosa, spring rolls and peppered gizzard (serves 2)", 8000],
      ["Moi moi", "One wrap, with egg", 1000],
      ["Zobo (50cl)", "Chilled, lightly sweetened", 1000],
      ["Chapman (50cl)", "House recipe", 1500],
    ].map(([name, description, price], i) => ({
      tenantId: kitchen.id,
      kind: "product" as const,
      name: name as string,
      description: description as string,
      priceKobo: koboFromNaira(price as number),
      sortOrder: i,
    })),
  );

  return { salon, kitchen };
}

/** Creates the demo businesses on first start, so a fresh install is usable straight away. */
export async function ensureDemoData(db: Database) {
  if (process.env.SKIP_DEMO_SEED === "true") return;
  const [{ value }] = await db.select({ value: count() }).from(tenants);
  if (value > 0) return;
  const password = env.demoPassword;
  if (!password) {
    console.warn("[seed] No tenants yet and DEMO_PASSWORD is not set, so no demo businesses were created.");
    return;
  }
  await seedDemoTenants(db, password);
  console.info("[seed] Created the demo businesses Glow Up Studio and Mama Nkechi's Kitchen.");
}
