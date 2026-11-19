import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/ui";
import { requireCohortAccess } from "@/lib/learn";
import { canReview, ownReview } from "@/lib/reviews";
import { brandFor } from "@/lib/teachers";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Rate this course" };

export default async function ReviewPage({ params }: PageProps<"/learn/[cohortId]/review">) {
  const { cohortId } = await params;
  const { db, user, cohort, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/review`);
  const teaching = user.role === "teacher";
  const open = !teaching && (await canReview(db, user.id, cohortId));
  const mine = teaching ? null : await ownReview(db, user.id, course.id);
  const teacher = await brandFor(db, course.teacherId);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/learn/${cohortId}`} className="text-sm text-muted hover:text-primary">
        ← {course.title}
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill tone="primary">{cohort.selfPaced ? "Video course" : `${cohort.name} intake`}</Pill>
        {mine?.status === "hidden" && <Pill tone="warning">Hidden from the course page by your teacher</Pill>}
      </div>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">{mine ? "Your review" : "Rate this course"}</h1>
      <p className="mt-2 text-muted">
        How was {course.title}? Your stars and review help other students choose, and your feedback helps {teacher.name} make the course better.
      </p>

      <div className="card mt-6">
        {teaching ? (
          <p className="text-sm text-muted">
            This is where your students rate the course when they reach the end. Their reviews and private feedback are in{" "}
            <Link href="/teach/reviews" className="font-medium text-primary hover:underline">
              Teaching › Reviews
            </Link>
            .
          </p>
        ) : open ? (
          <ReviewForm
            cohortId={cohortId}
            rating={mine?.rating ?? 0}
            comment={mine?.comment ?? ""}
            feedback={mine?.feedback ?? ""}
            teacherName={teacher.name}
            editing={!!mine}
          />
        ) : (
          <p className="text-sm text-muted">
            {cohort.selfPaced
              ? "You can rate this course once you've watched every lesson."
              : "You can rate this course once the last class of your intake has ended."}{" "}
            Keep going, you&apos;re nearly there!
          </p>
        )}
      </div>
    </div>
  );
}
