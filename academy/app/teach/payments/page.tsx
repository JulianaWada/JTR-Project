import { desc, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { Flash, PageTitle, Pill, Stat } from "@/components/ui";
import { getDb, schema } from "@/lib/db";
import { modes } from "@/lib/env";
import { naira } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import { createDiscount, toggleDiscount } from "../actions";

export const metadata: Metadata = { title: "Payments" };

export default async function Payments({ searchParams }: PageProps<"/teach/payments">) {
  const db = await getDb();
  const rows = await db.query.payments.findMany({ orderBy: desc(schema.payments.createdAt), limit: 200 });
  const enrolments = rows.length ? await db.query.enrolments.findMany({ where: inArray(schema.enrolments.id, rows.map((r) => r.enrolmentId)) }) : [];
  const users = enrolments.length ? await db.query.users.findMany({ where: inArray(schema.users.id, enrolments.map((e) => e.userId)) }) : [];
  const cohorts = await db.query.cohorts.findMany();
  const courses = await db.query.courses.findMany();
  const codes = await db.query.discountCodes.findMany({ orderBy: desc(schema.discountCodes.createdAt) });
  const paid = rows.filter((r) => r.status === "success");
  const byCourse = courses.map((c) => ({
    course: c,
    total: paid
      .filter((p) => {
        const e = enrolments.find((x) => x.id === p.enrolmentId);
        return cohorts.find((k) => k.id === e?.cohortId)?.courseId === c.id;
      })
      .reduce((s, p) => s + p.amountKobo, 0),
  }));

  return (
    <>
      <PageTitle eyebrow="Teacher" title="Payments">
        {modes().paystack === "test"
          ? "Test mode: these are practice payments. Add your Paystack secret key to take real money."
          : "Payments through Paystack. Money settles to your Paystack balance."}
      </PageTitle>
      <Flash searchParams={searchParams} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total received" value={naira(paid.reduce((s, p) => s + p.amountKobo, 0))} hint={`${paid.length} payments`} />
        {byCourse.map(({ course, total }) => (
          <Stat key={course.id} label={course.title} value={naira(total)} />
        ))}
      </div>

      <section className="card mt-6 overflow-x-auto">
        <h2 className="font-display text-lg font-semibold text-ink">All payments</h2>
        <table className="table mt-3">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const e = enrolments.find((x) => x.id === p.enrolmentId);
              const u = users.find((x) => x.id === e?.userId);
              const cohort = cohorts.find((k) => k.id === e?.cohortId);
              const course = courses.find((c) => c.id === cohort?.courseId);
              return (
                <tr key={p.id}>
                  <td className="whitespace-nowrap text-muted">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                  <td>
                    <p className="font-medium text-ink">{u?.name}</p>
                    <p className="text-xs text-muted">{u?.email}</p>
                  </td>
                  <td className="text-muted">
                    {course?.title}
                    <br />
                    <span className="text-xs">{cohort?.name}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    {naira(p.amountKobo)}
                    {p.discountCode && <span className="block text-xs text-muted">{p.discountCode}</span>}
                  </td>
                  <td>
                    {p.status === "success" ? <Pill tone="success">Paid</Pill> : p.status === "pending" ? <Pill tone="warning">Not finished</Pill> : <Pill>Replaced</Pill>}
                    {p.provider === "test" && <span className="ms-1 text-xs text-muted">test</span>}
                  </td>
                  <td className="font-mono text-xs text-muted">{p.reference}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section id="discounts" className="card mt-6 scroll-mt-24">
        <h2 className="font-display text-lg font-semibold text-ink">Discount codes</h2>
        <table className="table mt-3">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Course</th>
              <th>Used</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.code}>
                <td className="font-mono font-medium text-ink">{c.code}</td>
                <td>{c.percentOff}% off</td>
                <td className="text-muted">{courses.find((x) => x.id === c.courseId)?.title ?? "Any course"}</td>
                <td className="text-muted">
                  {c.uses}
                  {c.maxUses ? ` / ${c.maxUses}` : ""}
                </td>
                <td className="text-end">
                  <form action={toggleDiscount.bind(null, c.code)}>
                    <button className={`text-sm font-medium hover:underline ${c.active ? "text-danger" : "text-primary"}`}>{c.active ? "Turn off" : "Turn on"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={createDiscount} className="mt-4 grid gap-3 rounded-xl bg-surface-2 p-4 sm:grid-cols-5 sm:items-end">
          <div>
            <label className="label" htmlFor="code">
              New code
            </label>
            <input className="input uppercase" id="code" name="code" placeholder="FRIENDS10" required />
          </div>
          <div>
            <label className="label" htmlFor="percent">
              % off
            </label>
            <input className="input" id="percent" name="percent" type="number" min={1} max={100} defaultValue={10} required />
          </div>
          <div>
            <label className="label" htmlFor="courseId">
              Course
            </label>
            <select className="input" id="courseId" name="courseId" defaultValue="">
              <option value="">Any course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="maxUses">
              Max uses
            </label>
            <input className="input" id="maxUses" name="maxUses" type="number" min={1} placeholder="No limit" />
          </div>
          <button className="btn-primary">Create code</button>
        </form>
      </section>
    </>
  );
}
