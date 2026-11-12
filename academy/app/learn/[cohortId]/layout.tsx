import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canManageCohort } from "@/lib/teachers";

/** Reminds the teacher that they're looking at their course through a student's eyes. */
export default async function CohortLayout({ children, params }: LayoutProps<"/learn/[cohortId]">) {
  const { cohortId } = await params;
  const user = await currentUser();
  const teaching = user?.role === "teacher" && /^[0-9a-f-]{36}$/i.test(cohortId) && (await canManageCohort(await getDb(), user, cohortId));
  return (
    <>
      {teaching && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-primary/30 bg-primary-soft p-4 text-sm text-ink">
          <p>
            <span className="font-semibold">Student view.</span> This is what your students see. You can look at everything; nothing here counts as a
            student&apos;s progress.
          </p>
          <Link href="/learn/preview" className="btn-secondary btn-sm">
            All courses
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
