import Link from "next/link";
import { currentUser } from "@/lib/auth";

/** Reminds the teacher that they're looking at a course through a student's eyes. */
export default async function CohortLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <>
      {user?.role === "teacher" && (
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
