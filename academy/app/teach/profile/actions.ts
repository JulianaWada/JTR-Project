"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { cleanImage, safeColor } from "@/lib/teachers";

function str(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

/** A teacher's own public profile: name, logo, photo, bio and colour. */
export async function saveProfile(form: FormData) {
  const user = await requireTeacher();
  const db = await getDb();
  const back = (qs: string): never => redirect(`/teach/profile?${qs}`);
  const profile = await db.query.teacherProfiles.findFirst({ where: eq(schema.teacherProfiles.userId, user.id) });
  if (!profile) back(`error=${encodeURIComponent("Your teacher profile wasn't found.")}`);

  const image = (key: "logo" | "photo") => {
    const v = String(form.get(key) ?? "keep");
    if (v === "keep") return { changed: false, value: profile![key] };
    if (v === "remove") return { changed: true, value: null };
    const clean = cleanImage(v);
    if (!clean) back(`error=${encodeURIComponent(`That ${key} picture is too big or not a PNG, JPG or WebP. Please try a smaller one.`)}`);
    return { changed: true, value: clean };
  };
  const logo = image("logo");
  const photo = image("photo");
  let website = str(form, "website", 200);
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website && !/^https?:\/\/\S+\.\S+$/i.test(website)) back(`error=${encodeURIComponent("The website link doesn't look right.")}`);
  const name = str(form, "personName", 80);
  if (name.length >= 2 && name !== user.name) await db.update(schema.users).set({ name }).where(eq(schema.users.id, user.id));

  await db
    .update(schema.teacherProfiles)
    .set({
      brandName: str(form, "brandName", 80),
      headline: str(form, "headline", 120),
      bio: str(form, "bio", 2000),
      website,
      brandColor: safeColor(str(form, "brandColor", 7)),
      logo: logo.value,
      photo: photo.value,
      ...(logo.changed || photo.changed ? { imageVersion: profile!.imageVersion + 1 } : {}),
    })
    .where(eq(schema.teacherProfiles.userId, user.id));
  revalidatePath("/", "layout");
  back(`saved=${encodeURIComponent("Profile saved. Your courses now show it.")}`);
}
