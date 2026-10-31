import { and, eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { userBadges } from "@/lib/db/schema";
import { getProgress, type Progress } from "@/lib/progress";

export type BadgeKey = "first-class" | "first-assignment" | "quiz-ace" | "halfway" | "perfect-attendance" | "final-project" | "graduate";

export const BADGES: Record<BadgeKey, { name: string; description: string; icon: string; earned: (p: Progress) => boolean }> = {
  "first-class": { name: "First class", description: "Joined your first live class", icon: "🎬", earned: (p) => p.attended >= 1 },
  "first-assignment": { name: "Getting to work", description: "Handed in your first assignment", icon: "📝", earned: (p) => p.submitted >= 1 },
  "quiz-ace": { name: "Quiz ace", description: "Scored full marks on a quiz", icon: "🎯", earned: (p) => p.perfectQuizzes >= 1 },
  halfway: { name: "Halfway there", description: "Attended half of the live classes", icon: "⛰️", earned: (p) => p.totalClasses > 0 && p.attended * 2 >= p.totalClasses },
  "perfect-attendance": {
    name: "Perfect attendance",
    description: "Attended every live class",
    icon: "⭐",
    earned: (p) => p.totalClasses > 0 && p.attended === p.totalClasses,
  },
  "final-project": { name: "Project passed", description: "Passed the final project", icon: "🏆", earned: (p) => p.finalProjectPassed },
  graduate: { name: "Graduate", description: "Earned the course certificate", icon: "🎓", earned: (p) => p.certificateCode !== null },
};

export const BADGE_ORDER = Object.keys(BADGES) as BadgeKey[];

/** Awards every badge the student has newly earned in this cohort. Returns the new ones. */
export async function awardBadges(db: Database, userId: string, cohortId: string, progress?: Progress): Promise<BadgeKey[]> {
  const p = progress ?? (await getProgress(db, userId, cohortId));
  const have = new Set(
    (await db.query.userBadges.findMany({ where: and(eq(userBadges.userId, userId), eq(userBadges.cohortId, cohortId)) })).map((b) => b.badge),
  );
  const fresh = BADGE_ORDER.filter((key) => !have.has(key) && BADGES[key].earned(p));
  if (fresh.length) {
    await db
      .insert(userBadges)
      .values(fresh.map((badge) => ({ userId, cohortId, badge })))
      .onConflictDoNothing();
  }
  return fresh;
}
