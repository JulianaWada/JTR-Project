import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImagePicker } from "@/components/image-picker";
import { Flash, PageTitle } from "@/components/ui";
import { asset } from "@/lib/assets";
import { requireTeacher } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { brandFromProfile } from "@/lib/teachers";
import { saveProfile } from "./actions";

export const metadata: Metadata = { title: "My profile" };

export default async function Profile({ searchParams }: PageProps<"/teach/profile">) {
  const user = await requireTeacher();
  if (user.isAdmin) redirect("/teach");
  const db = await getDb();
  const profile = await db.query.teacherProfiles.findFirst({ where: eq(schema.teacherProfiles.userId, user.id) });
  if (!profile) redirect("/teach");
  const brand = brandFromProfile(profile, user.name);

  return (
    <>
      <PageTitle eyebrow="Teacher" title="My profile & logo">
        This is how students see you: on your course pages, in your class room and at the top of your dashboard.
      </PageTitle>
      <Flash searchParams={searchParams} />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <form action={saveProfile} className="card space-y-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <ImagePicker name="logo" label="Logo" current={brand.logo ? asset(brand.logo) : null} hint="Square works best. PNG with a clear background is ideal." />
            <ImagePicker name="photo" label="Your photo" current={brand.photo ? asset(brand.photo) : null} shape="round" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="personName">
                Your name
              </label>
              <input className="input" id="personName" name="personName" defaultValue={user.name} minLength={2} maxLength={80} required />
            </div>
            <div>
              <label className="label" htmlFor="brandName">
                School or brand name <span className="font-normal text-muted">(optional)</span>
              </label>
              <input className="input" id="brandName" name="brandName" defaultValue={profile.brandName} maxLength={80} placeholder={user.name} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="headline">
              One line about you
            </label>
            <input className="input" id="headline" name="headline" defaultValue={profile.headline} maxLength={120} placeholder="e.g. Animator and illustrator" />
          </div>
          <div>
            <label className="label" htmlFor="bio">
              About you
            </label>
            <textarea className="input min-h-32" id="bio" name="bio" defaultValue={profile.bio} maxLength={2000} />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="label" htmlFor="website">
                Website or social link
              </label>
              <input className="input" id="website" name="website" defaultValue={profile.website} maxLength={200} placeholder="https://…" />
            </div>
            <div>
              <label className="label" htmlFor="brandColor">
                Brand colour
              </label>
              <input className="input h-11 w-24 cursor-pointer p-1" id="brandColor" name="brandColor" type="color" defaultValue={brand.color} />
            </div>
          </div>
          <button className="btn-primary">Save profile</button>
        </form>

        <aside>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Preview on your course pages</p>
          <TeacherCardPreview brand={brand} />
          <Link href="/teach/courses" className="btn-secondary btn-sm mt-4">
            Go to my courses
          </Link>
        </aside>
      </div>
    </>
  );
}

function TeacherCardPreview({ brand }: { brand: ReturnType<typeof brandFromProfile> }) {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="h-2" style={{ background: brand.color }} />
      <div className="p-5">
        <div className="flex items-center gap-3">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded logo
            <img src={asset(brand.logo)} alt="" className="size-12 rounded-xl border border-line bg-white object-contain p-0.5" />
          ) : (
            <span className="grid size-12 place-items-center rounded-xl font-display text-lg font-bold text-white" style={{ background: brand.color }}>
              {brand.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <p className="text-xs text-muted">Taught by</p>
            <p className="font-display font-semibold text-ink">{brand.name}</p>
          </div>
        </div>
        {brand.headline && <p className="mt-3 text-sm font-medium text-ink">{brand.headline}</p>}
        {brand.bio && <p className="mt-2 line-clamp-4 text-sm text-muted">{brand.bio}</p>}
      </div>
    </div>
  );
}
