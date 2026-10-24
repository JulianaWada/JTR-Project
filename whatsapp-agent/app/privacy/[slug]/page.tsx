import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb, schema } from "@/lib/db";

export const metadata: Metadata = { title: "Privacy notice" };

// Draft wording for the Nigeria Data Protection Act 2023. Needs review by a lawyer before launch.
export default async function PrivacyNotice({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const tenant = await db.query.tenants.findFirst({ where: eq(schema.tenants.slug, slug) });
  if (!tenant) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-slate-800">
      <h1 className="text-2xl font-semibold text-navy">How {tenant.name} uses your information on WhatsApp</h1>
      <div className="mt-6 space-y-4 text-sm leading-6">
        <p>
          When you message {tenant.name} on WhatsApp, an AI assistant replies on the business&apos;s behalf so you get answers faster, any time of day. A member of the team can read the chat and take over at any time. Reply <strong>HUMAN</strong> to talk to a person.
        </p>
        <h2 className="pt-2 font-semibold text-navy">What we keep</h2>
        <p>Your WhatsApp number and profile name, the messages in the chat, the name you give for bookings, delivery addresses, and your orders, bookings and payment status. We don&apos;t see or store card details.</p>
        <h2 className="pt-2 font-semibold text-navy">Why</h2>
        <p>To answer your questions, take your orders and bookings, send payment links, and send reminders you agreed to. We don&apos;t use your chats for advertising and don&apos;t sell your information.</p>
        <h2 className="pt-2 font-semibold text-navy">Who helps us</h2>
        <p>
          Meta (WhatsApp) delivers the messages. Anthropic (Claude) processes messages to write replies. Paystack processes payments. Jules TechRight Ltd runs the system for {tenant.name}. Some of these providers process data outside Nigeria, with safeguards as required by the Nigeria Data Protection Act 2023.
        </p>
        <h2 className="pt-2 font-semibold text-navy">Your choices</h2>
        <p>
          Reply <strong>STOP</strong> to stop reminders and updates, and <strong>START</strong> to turn them back on. You can ask {tenant.name} for a copy of your information, to correct it, or to delete it, by messaging this number or visiting {tenant.address || "the business"}.
        </p>
        <h2 className="pt-2 font-semibold text-navy">How long we keep it</h2>
        <p>Chats are kept for up to 12 months, and records of payments for as long as the law requires.</p>
      </div>
    </main>
  );
}
