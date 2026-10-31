import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { schema } from "@/lib/db";
import { modes } from "@/lib/env";
import { requireCohortAccess } from "@/lib/learn";
import { TutorChat } from "./chat";

export const metadata: Metadata = { title: "AI tutor" };

export default async function TutorPage({ params, searchParams }: PageProps<"/learn/[cohortId]/tutor">) {
  const { cohortId } = await params;
  const { q } = await searchParams;
  const { db, user, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/tutor`);
  const history = await db.query.tutorMessages.findMany({
    where: and(eq(schema.tutorMessages.userId, user.id), eq(schema.tutorMessages.cohortId, cohortId)),
    orderBy: asc(schema.tutorMessages.createdAt),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/learn/${cohortId}`} className="text-sm text-muted hover:text-primary">
        ← {course.title}
      </Link>
      <div className="mt-3 mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">✨ AI tutor</h1>
          <p className="text-sm text-muted">
            Answers from the {course.title} lessons{modes().claude === "test" ? " (test mode: answers are quoted from the notes)" : ", powered by Claude"}. Jules can see the
            questions asked, to improve the classes.
          </p>
        </div>
      </div>
      <TutorChat
        cohortId={cohortId}
        initial={history.map((m) => ({ role: m.role, content: m.content }))}
        prefill={typeof q === "string" ? q : undefined}
        topic={course.slug.includes("sales") ? "sales" : "animation"}
        firstName={user.name.split(" ")[0]}
      />
    </div>
  );
}
