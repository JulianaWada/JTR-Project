import type { Metadata } from "next";
import Link from "next/link";
import { chatMessagesFor } from "@/lib/chat";
import { requireCohortAccess } from "@/lib/learn";
import { ClassChat } from "./chat";

export const metadata: Metadata = { title: "Class chat" };

export default async function ChatPage({ params }: PageProps<"/learn/[cohortId]/chat">) {
  const { cohortId } = await params;
  const { db, user, cohort, course } = await requireCohortAccess(cohortId, `/learn/${cohortId}/chat`);
  const messages = await chatMessagesFor(db, user, cohortId);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/learn/${cohortId}`} className="text-sm text-muted hover:text-primary">
        ← {course.title}
      </Link>
      <div className="mt-3 mb-4">
        <h1 className="font-display text-2xl font-semibold text-ink">💬 Class chat</h1>
        <p className="text-sm text-muted">
          {cohort.selfPaced ? `Everyone taking ${course.title}` : `Everyone in the ${cohort.name} intake of ${course.title}`}, and your teacher. Share your work, ask
          questions and help each other. Please be kind: only classmates who have paid for this course can see this chat.
        </p>
      </div>
      <ClassChat cohortId={cohortId} initial={messages} teacher={user.role === "teacher"} />
    </div>
  );
}
