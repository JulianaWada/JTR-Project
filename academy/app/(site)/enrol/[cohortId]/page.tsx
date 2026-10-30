import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { seatsTaken } from "@/lib/enrolment";
import { modes } from "@/lib/env";
import { naira } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/time";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Enrol" };

export default async function EnrolPage({ params }: PageProps<"/enrol/[cohortId]">) {
  const { cohortId } = await params;
  const user = await requireUser(`/enrol/${cohortId}`);
  const db = await getDb();
  const cohort = await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, cohortId) });
  if (!cohort) notFound();
  const course = (await db.query.courses.findFirst({ where: eq(schema.courses.id, cohort.courseId) }))!;
  const enrolment = await db.query.enrolments.findFirst({
    where: and(eq(schema.enrolments.userId, user.id), eq(schema.enrolments.cohortId, cohortId)),
  });
  if (enrolment?.status === "active") redirect(`/learn/${cohortId}`);
  const lessons = await db.query.classes.findMany({ where: eq(schema.classes.cohortId, cohortId), orderBy: asc(schema.classes.startsAt) });
  const full = (await seatsTaken(db, cohortId)) >= cohort.capacity;
  const open = cohort.enrolmentOpen && !full;

  return (
    <div className="mx-auto grid max-w-site gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <Link href={`/courses/${course.slug}`} className="text-sm text-muted hover:text-primary">
          ← {course.title}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">Enrol in {course.title}</h1>
        <p className="mt-2 text-muted">
          {cohort.name} intake, starting {formatDate(cohort.startsAt)}. You&apos;re enrolling as <strong className="text-ink">{user.name}</strong> (
          {user.email}).
        </p>
        <h2 className="mt-8 font-semibold text-ink">Your live classes</h2>
        <ul className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
          {lessons.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span className="text-ink">
                <span className="text-muted">Week {l.week} · </span>
                {l.title}
              </span>
              <span className="shrink-0 text-muted">{formatDateTime(l.startsAt)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">All times are Lagos time (WAT). Every class is recorded in case you miss one.</p>
      </div>
      <aside className="card lg:self-start">
        <p className="text-sm text-muted">Total</p>
        <p className="font-display text-4xl font-semibold text-ink">{naira(course.priceKobo)}</p>
        <p className="mt-1 mb-6 text-xs text-muted">Includes all live classes, recordings, the AI tutor and your certificate.</p>
        {open ? (
          <CheckoutForm cohortId={cohortId} price={naira(course.priceKobo)} testMode={modes().paystack === "test"} />
        ) : (
          <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">{full ? "This intake is full." : "Enrolment for this intake is closed."}</p>
        )}
      </aside>
    </div>
  );
}
