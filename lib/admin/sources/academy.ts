import "server-only";
import { connect, envUrl, type SourceMode } from "./pg";

// JTR Academy (academy/ in this repository). Its schema and migrations are academy/lib/db/schema.ts
// and academy/drizzle. Set ACADEMY_DATABASE_URL (ideally a read-only role) to read it; without it the
// board shows the same sample courses and students as the academy's own test mode. Read only.

export type AcademyCourse = {
  id: string;
  slug: string;
  title: string;
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
  return envUrl("ACADEMY_DATABASE_URL") ? "live" : "sample";
}

/** The academy's own pages, for editing. It is served at /academy on this site once ACADEMY_URL is set. */
export function academyTeachUrl(path = "") {
  return envUrl("ACADEMY_URL") ? `/academy/teach${path}` : undefined;
}

function db() {
  return connect(envUrl("ACADEMY_DATABASE_URL")!);
}

export async function listCourses(): Promise<AcademyCourse[]> {
  if (academyMode() === "sample") return sample().courses;
  const rows = await db()`
    select c.id, c.slug, c.title, c.price_kobo, c.published,
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
    priceKobo: r.price_kobo,
    published: r.published,
    cohorts: r.cohorts,
    activeStudents: r.active_students,
    revenueKobo: Number(r.revenue_kobo),
  }));
}

export async function listCohorts(): Promise<AcademyCohort[]> {
  if (academyMode() === "sample") return sample().cohorts;
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
  if (academyMode() === "sample") return sample().students;
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
  if (academyMode() === "sample") return sample().payments;
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

// --- Sample data for test mode (mirrors academy/lib/seed.ts) ---------------------------------------

const SALES = "Boost Sales with AI";
const ANIMATION = "Create Animation Videos with AI";

function days(n: number) {
  return new Date(Date.now() + n * 86_400_000);
}

let cached: ReturnType<typeof build> | undefined;
function sample() {
  return (cached ??= build());
}

function build() {
  const courses: AcademyCourse[] = [
    { id: "sample-sales", slug: "boost-sales-with-ai", title: SALES, priceKobo: 5_000_000, published: true, cohorts: 2, activeStudents: 2, revenueKobo: 10_000_000 },
    { id: "sample-animation", slug: "animation-videos-with-ai", title: ANIMATION, priceKobo: 5_000_000, published: true, cohorts: 2, activeStudents: 1, revenueKobo: 5_000_000 },
  ];
  const cohorts: AcademyCohort[] = [
    { id: "c-sales-jan", course: SALES, name: "January 2027", startsAt: new Date("2027-01-12T17:00:00Z"), capacity: 30, enrolmentOpen: true, activeStudents: 0, pendingStudents: 0 },
    { id: "c-anim-jan", course: ANIMATION, name: "January 2027", startsAt: new Date("2027-01-13T17:00:00Z"), capacity: 30, enrolmentOpen: true, activeStudents: 0, pendingStudents: 0 },
    { id: "c-sales-nov", course: SALES, name: "November 2026", startsAt: new Date("2026-11-03T17:00:00Z"), capacity: 30, enrolmentOpen: false, activeStudents: 2, pendingStudents: 0 },
    { id: "c-anim-sep", course: ANIMATION, name: "September 2026", startsAt: new Date("2026-09-08T17:00:00Z"), capacity: 30, enrolmentOpen: false, activeStudents: 1, pendingStudents: 0 },
  ];
  const students: AcademyStudent[] = [
    { id: "s-ada", name: "Ada Okafor", email: "ada@example.com", phone: "+234 803 000 0001", courses: SALES, certificates: 0, createdAt: days(-26) },
    { id: "s-tunde", name: "Tunde Bello", email: "tunde@example.com", phone: "+234 803 000 0002", courses: SALES, certificates: 0, createdAt: days(-26) },
    { id: "s-chioma", name: "Chioma Eze", email: "chioma@example.com", phone: "+234 803 000 0003", courses: ANIMATION, certificates: 1, createdAt: days(-61) },
  ];
  const payments: AcademyPayment[] = [
    { id: "p-ada", reference: "ac_demo_ada", student: "Ada Okafor", course: SALES, cohort: "November 2026", amountKobo: 5_000_000, discountCode: null, status: "success", provider: "test", createdAt: days(-25) },
    { id: "p-tunde", reference: "ac_demo_tunde", student: "Tunde Bello", course: SALES, cohort: "November 2026", amountKobo: 5_000_000, discountCode: null, status: "success", provider: "test", createdAt: days(-25) },
    { id: "p-chioma", reference: "ac_demo_chioma", student: "Chioma Eze", course: ANIMATION, cohort: "September 2026", amountKobo: 5_000_000, discountCode: null, status: "success", provider: "test", createdAt: days(-60) },
  ];
  return { courses, cohorts, students, payments };
}
