import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/** A teacher's uploaded logo or photo (stored as a data URL), served as a normal image that browsers can cache. */
export async function GET(_request: Request, { params }: RouteContext<"/teacher-images/[userId]/[kind]">) {
  const { userId, kind } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(userId) || (kind !== "logo" && kind !== "photo")) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const profile = await db.query.teacherProfiles.findFirst({ where: eq(schema.teacherProfiles.userId, userId), columns: { logo: true, photo: true } });
  const data = profile?.[kind];
  const match = data?.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      // The URL carries ?v=<imageVersion>, so a new upload gets a new address.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
