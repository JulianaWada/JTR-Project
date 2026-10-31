import type { Metadata } from "next";
import Link from "next/link";
import { BadgeGrid } from "@/components/badge-grid";
import { Empty, PageTitle } from "@/components/ui";
import { asset } from "@/lib/assets";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { badgesFor, studentOverview } from "@/lib/student";

export const metadata: Metadata = { title: "Badges and certificates" };

export default async function BadgesPage() {
  const user = await requireUser("/learn/badges");
  const db = await getDb();
  const courses = (await studentOverview(db, user.id)).filter((c) => c.enrolment.status === "active");
  const badges = await badgesFor(db, user.id);

  return (
    <>
      <PageTitle eyebrow="Achievements" title="Badges and certificates">
        Badges arrive as you attend, practise and hand in work. Your certificate comes when you complete a course.
      </PageTitle>
      {courses.length === 0 && <Empty>Join a course to start earning badges.</Empty>}
      <div className="space-y-8">
        {courses.map(({ cohort, course, progress }) => (
          <section key={cohort.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">{course.title}</h2>
                <p className="text-sm text-muted">{cohort.name} intake</p>
              </div>
              {progress?.certificateCode ? (
                <div className="flex gap-2">
                  <a href={asset(`/certificates/${progress.certificateCode}/pdf`)} className="btn-primary btn-sm">
                    🎓 Download certificate
                  </a>
                  <Link href={`/verify/${progress.certificateCode}`} className="btn-secondary btn-sm">
                    Share link
                  </Link>
                </div>
              ) : (
                <Link href={`/learn/${cohort.id}`} className="btn-secondary btn-sm">
                  See what&apos;s left
                </Link>
              )}
            </div>
            <div className="mt-6">
              <BadgeGrid earned={badges.filter((b) => b.cohortId === cohort.id)} />
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
