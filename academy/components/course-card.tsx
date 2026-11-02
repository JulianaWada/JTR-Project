import Link from "next/link";
import type { CohortRow, CourseRow } from "@/lib/catalog";
import { money } from "@/lib/money";
import { formatDate } from "@/lib/time";
import { accentClasses, Pill } from "./ui";
import { CourseArt } from "./course-art";

/** `currency` is the visitor's (from their location): naira in Nigeria, dollars elsewhere when the course has a dollar price. */
export function CourseCard({
  course,
  nextCohort,
  currency = "NGN",
}: {
  course: CourseRow;
  nextCohort: (CohortRow & { seatsLeft: number }) | null;
  currency?: "NGN" | "USD";
}) {
  const accent = accentClasses(course.accent);
  const recorded = course.format === "recorded";
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group cut-corner flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-primary/60"
    >
      <CourseArt slug={course.slug} accent={course.accent} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-2">
          <Pill tone={course.accent === "violet" ? "violet" : "primary"}>{recorded ? "Video course" : "Live classes"}</Pill>
          <Pill>{recorded ? `${course.outline.length} lessons` : `${course.outline.length} ${course.lessonUnit === "day" ? "days" : "weeks"}`}</Pill>
          <Pill>Certificate</Pill>
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-ink group-hover:text-primary">{course.title}</h3>
        <p className="mt-2 flex-1 text-muted">{course.tagline}</p>
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-line pt-4">
          <div>
            <p className="font-display text-2xl font-semibold text-ink">{currency === "USD" && course.priceUsdCents ? money(course.priceUsdCents, "USD") : money(course.priceKobo)}</p>
            <p className="text-xs text-muted">
              {recorded
                ? nextCohort
                  ? "Start any time, at your own pace"
                  : "Opening soon"
                : nextCohort
                  ? `Next intake starts ${formatDate(nextCohort.startsAt)}`
                  : "Next intake coming soon"}
            </p>
          </div>
          <span className={`text-sm font-semibold ${accent.text}`}>View course →</span>
        </div>
      </div>
    </Link>
  );
}
