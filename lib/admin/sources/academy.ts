import "server-only";
import { connect, envUrl, type SourceMode } from "./pg";

// JTR Academy (academy/ in this repository). Its schema and migrations are academy/lib/db/schema.ts
// and academy/drizzle. Set ACADEMY_DATABASE_URL (ideally a read-only role) to read it; until then the
// board shows that the academy is not connected. Read only.

export type AcademyCourse = {
  id: string;
  slug: string;
  title: string;
  format: "live" | "recorded";
  priceKobo: number;
  published: boolean;
  cohorts: number;
  activeStudents: number;
  revenueKobo: number;
};

export type AcademyCohort = {
  id: string;
  course: string;
  name: string;
  startsAt: Date;
  capacity: number;
  enrolmentOpen: boolean;
  activeStudents: number;
  pendingStudents: number;
};

export type AcademyStudent = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  courses: string;
  certificates: number;
  createdAt: Date;
};

export type AcademyPayment = {
  id: string;
  reference: string;
  student: string;
  course: string;
  cohort: string;
  amountKobo: number;
  discountCode: string | null;
  status: string;
  provider: string;
  createdAt: Date;
};

export function academyMode(): SourceMode {
  return envUrl("ACADEMY_DATABASE_URL") ? "live" : "off";
}

/** The academy's own pages, for editing: on its subdomain (ACADEMY_PUBLIC_URL), or at /academy on this site (ACADEMY_URL). */
export function academyTeachUrl(path = "") {
  const publicUrl = envUrl("ACADEMY_PUBLIC_URL")?.replace(/\/$/, "");
  if (publicUrl) return `${publicUrl}/academy/teach${path}`;
  return envUrl("ACADEMY_URL") ? `/academy/teach${path}` : undefined;
}

function db() {
  return connect(envUrl("ACADEMY_DATABASE_URL")!);
}

export async function listCourses(): Promise<AcademyCourse[]> {
  if (academyMode() === "off") return [];
  const rows = await db()`
    select c.id, c.slug, c.title, c.format, c.price_kobo, c.published,
      (select count(*) from cohorts h where h.course_id = c.id)::int as cohorts,
      (select count(*) from enrolments e join cohorts h on h.id = e.cohort_id
        where h.course_id = c.id and e.status = 'active')::int as active_students,
      (select coalesce(sum(p.amount_kobo), 0) from payments p join enrolments e on e.id = p.enrolment_id
        join cohorts h on h.id = e.cohort_id where h.course_id = c.id and p.status = 'success')::bigint as revenue_kobo
    from courses c order by c.sort_order, c.created_at`;
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    format: r.format === "recorded" ? "recorded" : "live",
    priceKobo: r.price_kobo,
    published: r.published,
    cohorts: r.cohorts,
    activeStudents: r.active_students,
    revenueKobo: Number(r.revenue_kobo),
  }));
}

export async function listCohorts(): Promise<AcademyCohort[]> {
  if (academyMode() === "off") return [];
  const rows = await db()`
    select h.id, c.title as course, h.name, h.starts_at, h.capacity, h.enrolment_open,
      (select count(*) from enrolments e where e.cohort_id = h.id and e.status = 'active')::int as active_students,
      (select count(*) from enrolments e where e.cohort_id = h.id and e.status = 'pending')::int as pending_students
    from cohorts h join courses c on c.id = h.course_id
    order by h.starts_at desc`;
  return rows.map((r) => ({
    id: r.id,
    course: r.course,
    name: r.name,
    startsAt: new Date(r.starts_at),
    capacity: r.capacity,
    enrolmentOpen: r.enrolment_open,
    activeStudents: r.active_students,
    pendingStudents: r.pending_students,
  }));
}

export async function listStudents(limit = 200): Promise<AcademyStudent[]> {
  if (academyMode() === "off") return [];
  const rows = await db()`
    select u.id, u.name, u.email, u.phone, u.created_at,
      coalesce((select string_agg(distinct c.title, ', ') from enrolments e join cohorts h on h.id = e.cohort_id
        join courses c on c.id = h.course_id where e.user_id = u.id and e.status = 'active'), '') as courses,
      (select count(*) from certificates x where x.user_id = u.id and x.revoked_at is null)::int as certificates
    from users u where u.role = 'student'
    order by u.created_at desc limit ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    courses: r.courses,
    certificates: r.certificates,
    createdAt: new Date(r.created_at),
  }));
}

export async function listPayments(limit = 50): Promise<AcademyPayment[]> {
  if (academyMode() === "off") return [];
  const rows = await db()`
    select p.id, p.reference, u.name as student, c.title as course, h.name as cohort,
      p.amount_kobo, p.discount_code, p.status, p.provider, p.created_at
    from payments p join enrolments e on e.id = p.enrolment_id join users u on u.id = e.user_id
      join cohorts h on h.id = e.cohort_id join courses c on c.id = h.course_id
    order by p.created_at desc limit ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    student: r.student,
    course: r.course,
    cohort: r.cohort,
    amountKobo: r.amount_kobo,
    discountCode: r.discount_code,
    status: r.status,
    provider: r.provider,
    createdAt: new Date(r.created_at),
  }));
}
