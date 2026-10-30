import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassForm } from "@/components/class-form";
import { Flash, PageTitle } from "@/components/ui";
import { getDb, schema } from "@/lib/db";
import { addDays, toLagosParts } from "@/lib/time";

export const metadata: Metadata = { title: "Add a class" };

export default async function NewClass({ params, searchParams }: PageProps<"/teach/cohorts/[cohortId]/classes/new">) {
  const { cohortId } = await params;
  const db = await getDb();
  const cohort = await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, cohortId) });
  if (!cohort) notFound();
  const last = await db.query.classes.findFirst({ where: eq(schema.classes.cohortId, cohortId), orderBy: desc(schema.classes.startsAt) });
  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/teach/cohorts/${cohortId}`} className="text-sm text-muted hover:text-primary">
        ← {cohort.name} intake
      </Link>
      <PageTitle title="Add a class" />
      <Flash searchParams={searchParams} />
      <ClassForm
        cohortId={cohortId}
        defaults={{ week: (last?.week ?? 0) + 1, date: toLagosParts(last ? addDays(last.startsAt, 7) : cohort.startsAt).date }}
      />
    </div>
  );
}
