"use server";

import { requireCohortAccess } from "@/lib/learn";
import { askTutor } from "@/lib/tutor";

export async function ask(cohortId: string, question: string): Promise<{ answer?: string; error?: string }> {
  const { db, user } = await requireCohortAccess(cohortId, `/learn/${cohortId}/tutor`);
  return askTutor(db, user.id, cohortId, question);
}
