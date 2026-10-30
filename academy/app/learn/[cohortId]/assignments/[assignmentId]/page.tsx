import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill } from "@/components/ui";
import { schema } from "@/lib/db";
import { requireCohortAccess } from "@/lib/learn";
import { formatDateTime } from "@/lib/time";
import { SubmitForm } from "./submit-form";

export const metadata: Metadata = { title: "Assignment" };

export default async function AssignmentPage({ params }: PageProps<"/learn/[cohortId]/assignments/[assignmentId]">) {
  const { cohortId, assignmentId } = await params;
  const { db, user, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/assignments/${assignmentId}`);
  const task = await db.query.assignments.findFirst({ where: and(eq(schema.assignments.id, assignmentId), eq(schema.assignments.courseId, course.id)) });
  if (!task) notFound();
  const submission = await db.query.submissions.findFirst({
    where: and(eq(schema.submissions.assignmentId, assignmentId), eq(schema.submissions.userId, user.id)),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/learn/${cohortId}`} className="text-sm text-muted hover:text-primary">
        ← {course.title}
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill>Week {task.week}</Pill>
        {task.isFinalProject && <Pill tone="violet">Final project · counts for your certificate</Pill>}
      </div>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">{task.title}</h1>
      <div className="card mt-6">
        <h2 className="font-semibold text-ink">The brief</h2>
        <p className="mt-2 leading-relaxed text-ink">{task.brief}</p>
      </div>

      {submission && (
        <div className="card mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-ink">Your submission</h2>
            {submission.grade === "pass" ? (
              <Pill tone="success">Passed</Pill>
            ) : submission.grade === "redo" ? (
              <Pill tone="warning">Please resubmit</Pill>
            ) : (
              <Pill tone="primary">Waiting for marking</Pill>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">Handed in {formatDateTime(submission.submittedAt)}</p>
          {submission.feedback && (
            <blockquote className="mt-4 rounded-xl border-s-4 border-primary bg-surface-2 p-4 text-sm text-ink">
              <p className="text-xs font-semibold text-muted">Feedback from Jules</p>
              <p className="mt-1">{submission.feedback}</p>
            </blockquote>
          )}
        </div>
      )}

      {submission?.grade !== "pass" && (
        <div className="card mt-6">
          <h2 className="mb-4 font-semibold text-ink">{submission ? "Update your work" : "Hand in your work"}</h2>
          <SubmitForm cohortId={cohortId} assignmentId={assignmentId} text={submission?.text ?? ""} link={submission?.link ?? ""} resubmit={Boolean(submission)} />
          <p className="mt-4 text-sm text-muted">
            Need help getting started?{" "}
            <Link href={`/learn/${cohortId}/tutor?q=${encodeURIComponent(`I'm working on the assignment "${task.title}". Can you help me get started?`)}`} className="font-medium text-primary hover:underline">
              Ask the AI tutor
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
