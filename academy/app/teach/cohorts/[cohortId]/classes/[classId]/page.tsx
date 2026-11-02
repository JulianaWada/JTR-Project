import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClassForm } from "@/components/class-form";
import { Flash, PageTitle } from "@/components/ui";
import { getDb, schema } from "@/lib/db";
import { deleteClass } from "../../../../actions";
import { lessonLabel } from "@/lib/lesson-unit";

export const metadata: Metadata = { title: "Edit class" };

export default async function EditClass({ params, searchParams }: PageProps<"/teach/cohorts/[cohortId]/classes/[classId]">) {
  const { cohortId, classId } = await params;
  const db = await getDb();
  const lesson = await db.query.classes.findFirst({ where: and(eq(schema.classes.id, classId), eq(schema.classes.cohortId, cohortId)) });
  if (!lesson) notFound();
  const cohort = (await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, cohortId) }))!;
  const course = await db.query.courses.findFirst({ where: eq(schema.courses.id, cohort.courseId) });
  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/teach/cohorts/${cohortId}`} className="text-sm text-muted hover:text-primary">
        ← {cohort.selfPaced ? "Video lessons" : `${cohort.name} intake`}
      </Link>
      <PageTitle
        title={`${lessonLabel(course, cohort.selfPaced)} ${lesson.week}: ${lesson.title}`}
        actions={
          <Link href={`/learn/${cohortId}/classes/${classId}`} className="btn-secondary btn-sm">
            Preview as student
          </Link>
        }
      />
      <Flash searchParams={searchParams} />
      <ClassForm cohortId={cohortId} lesson={lesson} selfPaced={cohort.selfPaced} />
      <form action={deleteClass.bind(null, cohortId, classId)} className="mt-4 text-end">
        <button className="text-sm text-danger hover:underline">Delete this {cohort.selfPaced ? "lesson" : "class"}</button>
      </form>
    </div>
  );
}
