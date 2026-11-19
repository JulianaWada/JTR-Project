import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { getDb, schema, type Database } from "@/lib/db";
import { BASE_PATH, env } from "@/lib/env";
import { teachesCourse, type Staff } from "@/lib/teachers";
import { isLocked } from "@/lib/unlock";

/**
 * Paid course files (lesson narration and slides) live in academy/private, not public/, so nobody can open them
 * by guessing an address. They are served at their old addresses (/academy/lessons/..., /academy/slides/...) by
 * route handlers that first check the visitor may see them.
 */
export type CourseFileKind = "lessons" | "slides";

const ROOT = path.join(process.cwd(), "private");
const TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
/** How long a signed link (for Microsoft's PowerPoint viewer, which can't send the student's login) keeps working. */
export const SIGNED_LINK_SECONDS = 10 * 60;

/** The file's place under private/, or null for anything that isn't a plain course file (e.g. "../"). */
export function courseFilePath(kind: CourseFileKind, parts: string[]): string | null {
  if (parts.length < 2 || parts.length > 4) return null;
  if (!parts.every((p) => /^[\w-]+(\.[a-z0-9]+)?$/i.test(p))) return null;
  if (!TYPES[path.extname(parts[parts.length - 1]).toLowerCase()]) return null;
  const full = path.join(ROOT, kind, ...parts);
  return full.startsWith(path.join(ROOT, kind) + path.sep) ? full : null;
}

function signature(address: string, expires: number) {
  return createHmac("sha256", env.sessionSecret).update(`course-file:${address}:${expires}`).digest("base64url");
}

/** A short-lived link to a course file that works without the student's login (only for the PowerPoint viewer). */
export function signedFileUrl(address: string, now = Date.now()) {
  const expires = Math.floor(now / 1000) + SIGNED_LINK_SECONDS;
  return `${address}?expires=${expires}&sig=${signature(address, expires)}`;
}

export function validSignature(address: string, expires: string | null, sig: string | null, now = Date.now()) {
  if (!expires || !sig || !/^\d+$/.test(expires) || Number(expires) * 1000 < now) return false;
  const expected = Buffer.from(signature(address, Number(expires)));
  const actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

type Viewer = Staff | null;

/**
 * May this person open the course file at `address` (e.g. "/academy/slides/boost-sales-with-ai/lesson-1/01.webp")?
 * Yes for the course's teacher and the admin, and for students with an active (paid) enrolment in the course.
 * Slides of a live class also wait until the class day, like the rest of the class resources.
 */
export async function canOpenCourseFile(db: Database, user: Viewer, kind: CourseFileKind, courseSlug: string, address: string, now = new Date()) {
  if (!user) return false;
  const course = await db.query.courses.findFirst({ where: eq(schema.courses.slug, courseSlug), columns: { id: true, teacherId: true } });
  if (!course) return false;
  if (teachesCourse(user, course)) return true;

  const cohorts = await db.query.cohorts.findMany({ where: eq(schema.cohorts.courseId, course.id) });
  if (!cohorts.length) return false;
  const enrolments = await db.query.enrolments.findMany({
    where: and(
      eq(schema.enrolments.userId, user.id),
      eq(schema.enrolments.status, "active"),
      inArray(
        schema.enrolments.cohortId,
        cohorts.map((c) => c.id),
      ),
    ),
  });
  if (!enrolments.length) return false;
  if (kind === "lessons") return true;

  // Slides: the student must have a class using them that has opened.
  const mine = cohorts.filter((c) => enrolments.some((e) => e.cohortId === c.id));
  const lessons = await db.query.classes.findMany({
    where: inArray(
      schema.classes.cohortId,
      mine.map((c) => c.id),
    ),
  });
  const student = { role: "student" };
  return lessons.some((l) => {
    if (!l.slides || (l.slides.file !== address && !l.slides.images.includes(address))) return false;
    return !isLocked(l, mine.find((c) => c.id === l.cohortId)!, student, now);
  });
}

/** The route handler behind /academy/lessons/... and /academy/slides/... */
export async function serveCourseFile(request: Request, kind: CourseFileKind, parts: string[]) {
  const file = courseFilePath(kind, parts);
  if (!file) return notFound();
  const address = `${BASE_PATH}/${kind}/${parts.join("/")}`;
  const query = new URL(request.url).searchParams;
  let allowed = validSignature(address, query.get("expires"), query.get("sig"));
  // The local recording page (/render, never on the live site) plays lessons without a login.
  if (!allowed && !env.isProduction && kind === "lessons" && (request.headers.get("referer") ?? "").includes(`${BASE_PATH}/render/`)) allowed = true;
  if (!allowed) allowed = await canOpenCourseFile(await getDb(), await currentUser(), kind, parts[0], address);
  // 404 rather than 403, so the address doesn't even confirm the file exists.
  if (!allowed) return notFound();

  let body: Buffer;
  try {
    body = await readFile(file);
  } catch {
    return notFound();
  }
  const pptx = file.endsWith(".pptx");
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": TYPES[path.extname(file).toLowerCase()],
      "Content-Length": String(body.length),
      // Only the student's own browser may keep a copy; shared caches (Vercel's CDN) must never store it.
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      // Other websites can't show these files in their own pages.
      "Cross-Origin-Resource-Policy": pptx ? "cross-origin" : "same-origin",
    },
  });
}

function notFound() {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
