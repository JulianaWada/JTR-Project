import { eq, inArray, sql, type SQL } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { cohorts, courses, teacherProfiles, users, type TeacherStatus } from "@/lib/db/schema";

// Many teachers share the academy. Each course belongs to one teacher (courses.teacherId); a course without one
// is a JTR Academy course, run by the admin. The admin (Jules) sees and manages everything; every other teacher
// only their own courses, and everything under them: intakes, classes, students, marking, chats and payments.

export type Staff = { id: string; role: string; isAdmin: boolean };

/** True for the admin and for approved teachers. */
export function isTeacher(user: { role: string } | null | undefined) {
  return user?.role === "teacher";
}

/** Whether `user` runs this course (the admin runs them all). */
export function teachesCourse(user: Staff | null | undefined, course: { teacherId: string | null }) {
  if (!user || user.role !== "teacher") return false;
  return user.isAdmin || course.teacherId === user.id;
}

/** A filter on courses for what `user` may manage, or undefined for the admin (everything). */
export function ownCourses(user: Staff): SQL | undefined {
  return user.isAdmin ? undefined : eq(courses.teacherId, user.id);
}

/** The ids of the courses `user` manages, or null for the admin (all of them). */
export async function ownCourseIds(db: Database, user: Staff): Promise<string[] | null> {
  if (user.isAdmin) return null;
  const rows = await db.select({ id: courses.id }).from(courses).where(eq(courses.teacherId, user.id));
  return rows.map((r) => r.id);
}

/** The ids of the intakes `user` manages, or null for the admin (all of them). */
export async function ownCohortIds(db: Database, user: Staff): Promise<string[] | null> {
  const courseIds = await ownCourseIds(db, user);
  if (courseIds === null) return null;
  if (!courseIds.length) return [];
  const rows = await db.select({ id: cohorts.id }).from(cohorts).where(inArray(cohorts.courseId, courseIds));
  return rows.map((r) => r.id);
}

/** A where-clause limiting `column` (a cohort id column) to `ids`; null ids means no limit. An empty list matches nothing. */
export function inCohorts(column: Parameters<typeof inArray>[0], ids: string[] | null): SQL | undefined {
  if (ids === null) return undefined;
  return ids.length ? inArray(column, ids) : sql`false`;
}

/** Keeps only rows whose id is in `allowed` (null: everything is allowed). */
export function within<T>(rows: T[], allowed: string[] | null, idOf: (row: T) => string | null | undefined) {
  if (allowed === null) return rows;
  const set = new Set(allowed);
  return rows.filter((r) => {
    const id = idOf(r);
    return !!id && set.has(id);
  });
}

export async function canManageCourse(db: Database, user: Staff, courseId: string) {
  const course = await db.query.courses.findFirst({ where: eq(courses.id, courseId), columns: { teacherId: true } });
  return !!course && teachesCourse(user, course);
}

export async function canManageCohort(db: Database, user: Staff, cohortId: string) {
  const cohort = await db.query.cohorts.findFirst({ where: eq(cohorts.id, cohortId), columns: { courseId: true } });
  return !!cohort && canManageCourse(db, user, cohort.courseId);
}

/** What students see as the teacher of a course: the teacher's brand, or JTR Academy. */
export type TeacherBrand = {
  userId: string | null;
  name: string;
  person: string | null;
  headline: string;
  bio: string;
  website: string;
  color: string;
  logo: string | null;
  photo: string | null;
};

export const JTR_BRAND: TeacherBrand = {
  userId: null,
  name: "JTR Academy",
  person: null,
  headline: "Practical AI skills from Jules TechRight",
  bio: "",
  website: "",
  color: "#1563d6",
  logo: null,
  photo: null,
};

export function imageUrl(userId: string, kind: "logo" | "photo", version: number) {
  return `/teacher-images/${userId}/${kind}?v=${version}`;
}

/** The brand shown for a course's teacher. Courses without a teacher (or whose teacher isn't approved) show JTR Academy. */
export async function brandFor(db: Database, teacherId: string | null): Promise<TeacherBrand> {
  if (!teacherId) return JTR_BRAND;
  const row = await db
    .select({ profile: teacherProfiles, name: users.name, isAdmin: users.isAdmin })
    .from(teacherProfiles)
    .innerJoin(users, eq(users.id, teacherProfiles.userId))
    .where(eq(teacherProfiles.userId, teacherId))
    .then((r) => r[0]);
  if (!row || row.profile.status !== "approved") return JTR_BRAND;
  return brandFromProfile(row.profile, row.name);
}

export function brandFromProfile(p: typeof teacherProfiles.$inferSelect, personName: string): TeacherBrand {
  return {
    userId: p.userId,
    name: p.brandName || personName,
    person: personName,
    headline: p.headline,
    bio: p.bio,
    website: p.website,
    color: safeColor(p.brandColor),
    logo: p.logo ? imageUrl(p.userId, "logo", p.imageVersion) : null,
    photo: p.photo ? imageUrl(p.userId, "photo", p.imageVersion) : null,
  };
}

/** Brands for many teachers at once (catalogue pages). */
export async function brandsFor(db: Database, teacherIds: (string | null)[]): Promise<Map<string, TeacherBrand>> {
  const ids = [...new Set(teacherIds.filter((id): id is string => !!id))];
  const map = new Map<string, TeacherBrand>();
  if (!ids.length) return map;
  const rows = await db
    .select({ profile: teacherProfiles, name: users.name })
    .from(teacherProfiles)
    .innerJoin(users, eq(users.id, teacherProfiles.userId))
    .where(inArray(teacherProfiles.userId, ids));
  for (const r of rows) if (r.profile.status === "approved") map.set(r.profile.userId, brandFromProfile(r.profile, r.name));
  return map;
}

export function safeColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#1563d6";
}

export const STATUS_LABEL: Record<TeacherStatus, string> = {
  pending: "Waiting for approval",
  approved: "Approved",
  rejected: "Not approved",
  suspended: "Suspended",
};

/** Largest uploaded image we keep, as a data URL. The browser shrinks pictures before they are sent. */
export const MAX_IMAGE_CHARS = 400_000;

/** A data: URL of a PNG, JPEG or WebP picture, or null. SVG is refused: it can carry scripts. */
export function cleanImage(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  if (value.length > MAX_IMAGE_CHARS) return null;
  return /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : null;
}
