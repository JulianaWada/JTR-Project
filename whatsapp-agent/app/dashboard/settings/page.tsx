import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { deleteItem, saveItem } from "@/app/dashboard/actions";
import { requireTenant } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import type { CatalogItem } from "@/lib/db/schema";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Business details" };

function ItemRow({ item, isService }: { item?: CatalogItem; isService: boolean }) {
  return (
    <form action={saveItem} className="grid items-end gap-2 border-b border-slate-100 py-3 md:grid-cols-[2fr_3fr_110px_90px_auto_auto]">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div>
        <label className="label text-xs">Name</label>
        <input className="input py-1" name="name" defaultValue={item?.name} required placeholder={isService ? "e.g. Box braids" : "e.g. Ofada rice"} />
      </div>
      <div>
        <label className="label text-xs">Description</label>
        <input className="input py-1" name="description" defaultValue={item?.description} />
      </div>
      <div>
        <label className="label text-xs">Price (₦)</label>
        <input className="input py-1" name="price" type="number" min={1} step={50} defaultValue={item ? item.priceKobo / 100 : undefined} required />
      </div>
      {isService ? (
        <div>
          <label className="label text-xs">Minutes</label>
          <input className="input py-1" name="durationMinutes" type="number" min={5} step={5} defaultValue={item?.durationMinutes ?? 60} />
        </div>
      ) : (
        <div />
      )}
      <label className="flex items-center gap-1 pb-2 text-xs text-slate-600">
        <input type="checkbox" name="available" defaultChecked={item ? item.available : true} /> Available
      </label>
      <div className="flex gap-2">
        <button className="btn-secondary py-1">{item ? "Save" : "Add"}</button>
        {item && (
          <button formAction={deleteItem.bind(null, item.id)} className="btn-danger py-1">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

export default async function SettingsPage() {
  const tenant = await requireTenant();
  const db = await getDb();
  const items = await db.query.catalogItems.findMany({
    where: eq(schema.catalogItems.tenantId, tenant.id),
    orderBy: [asc(schema.catalogItems.sortOrder), asc(schema.catalogItems.name)],
  });
  const isService = tenant.kind !== "food";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Business details</h1>
        <p className="text-sm text-slate-500">Everything the assistant tells customers comes from this page.</p>
      </div>
      <SettingsForm tenant={tenant} />
      <section className="card">
        <h2 className="font-semibold text-navy">{isService ? "Services and prices" : "Menu"}</h2>
        <p className="text-sm text-slate-500">Untick “Available” when something is sold out; the assistant stops offering it.</p>
        {items.map((item) => (
          <ItemRow key={item.id} item={item} isService={isService} />
        ))}
        <p className="mt-4 text-sm font-medium text-slate-700">Add a new {isService ? "service" : "item"}</p>
        <ItemRow isService={isService} />
      </section>
    </div>
  );
}
