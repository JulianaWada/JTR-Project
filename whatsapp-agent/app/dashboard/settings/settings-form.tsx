"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/dashboard/actions";
import type { Tenant, WeekdayKey } from "@/lib/db/schema";

const DAYS: [WeekdayKey, string][] = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
];

export function SettingsForm({ tenant }: { tenant: Tenant }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const isFood = tenant.kind === "food";
  return (
    <form action={action} className="space-y-6">
      <div className="card space-y-4">
        <h2 className="font-semibold text-navy">Business</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Business name</label>
            <input className="input" id="name" name="name" defaultValue={tenant.name} required />
          </div>
          <div>
            <label className="label" htmlFor="ownerPhone">Your WhatsApp for alerts</label>
            <input className="input" id="ownerPhone" name="ownerPhone" defaultValue={tenant.ownerPhone ?? ""} placeholder="2348031234567" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="address">Address and directions</label>
          <input className="input" id="address" name="address" defaultValue={tenant.address} />
        </div>
        <div>
          <label className="label" htmlFor="info">What the assistant should know</label>
          <textarea className="input" id="info" name="info" rows={7} defaultValue={tenant.info} />
          <p className="mt-1 text-xs text-slate-500">
            Policies, delivery areas, parking, payment options, common questions. The assistant only answers from this page, so if it isn&apos;t here it will pass the chat to you.
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-navy">{isFood ? "Orders" : "Bookings"}</h2>
        {isFood ? (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="offersDelivery" defaultChecked={tenant.offersDelivery} /> We deliver
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="offersPickup" defaultChecked={tenant.offersPickup} /> Customers can pick up
            </label>
            <div>
              <label className="label" htmlFor="deliveryFee">Delivery fee (₦)</label>
              <input className="input" id="deliveryFee" name="deliveryFee" type="number" min={0} step={50} defaultValue={tenant.deliveryFeeKobo / 100} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="bookingCapacity">Customers you can serve at once</label>
              <input className="input" id="bookingCapacity" name="bookingCapacity" type="number" min={1} max={50} defaultValue={tenant.bookingCapacity} />
            </div>
            <div>
              <label className="label" htmlFor="bookingDepositPercent">Deposit to secure a booking (%)</label>
              <input className="input" id="bookingDepositPercent" name="bookingDepositPercent" type="number" min={0} max={100} defaultValue={tenant.bookingDepositPercent} />
              <p className="mt-1 text-xs text-slate-500">0 means bookings are confirmed without payment.</p>
            </div>
            <input type="hidden" name="offersPickup" value={tenant.offersPickup ? "on" : ""} />
            <input type="hidden" name="offersDelivery" value={tenant.offersDelivery ? "on" : ""} />
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-navy">Opening hours</h2>
        <div className="space-y-2">
          {DAYS.map(([key, label]) => {
            const slot = tenant.openingHours[key];
            return (
              <div key={key} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-2 text-sm">
                <span>{label}</span>
                <input className="input py-1" type="time" name={`${key}-open`} defaultValue={slot?.[0] ?? "09:00"} />
                <input className="input py-1" type="time" name={`${key}-close`} defaultValue={slot?.[1] ?? "18:00"} />
                <label className="flex items-center gap-1 text-xs text-slate-600">
                  <input type="checkbox" name={`${key}-closed`} defaultChecked={!slot} /> Closed
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        {state?.ok && <span className="text-sm text-emerald-700">Saved. The assistant uses the new details from the next message.</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
