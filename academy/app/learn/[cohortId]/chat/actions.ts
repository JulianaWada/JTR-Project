"use server";

import { type ChatMessageView, chatMessagesFor, deleteChatMessage, pinChatMessage, postChatMessage } from "@/lib/chat";
import { requireCohortAccess } from "@/lib/learn";

// Each action re-checks access: only the intake's paid students and the teacher reach its chat.

type Result = { messages?: ChatMessageView[]; error?: string };

async function access(cohortId: string) {
  return requireCohortAccess(cohortId, `/learn/${cohortId}/chat`);
}

export async function loadChat(cohortId: string): Promise<Result> {
  const { db, user } = await access(cohortId);
  return { messages: await chatMessagesFor(db, user, cohortId) };
}

export async function sendChat(cohortId: string, text: string): Promise<Result> {
  const { db, user } = await access(cohortId);
  const sent = await postChatMessage(db, user, cohortId, text);
  if ("error" in sent) return { error: sent.error };
  return { messages: await chatMessagesFor(db, user, cohortId) };
}

export async function removeChat(cohortId: string, messageId: string): Promise<Result> {
  const { db, user } = await access(cohortId);
  if (!(await deleteChatMessage(db, user, cohortId, messageId))) return { error: "You can only remove your own messages." };
  return { messages: await chatMessagesFor(db, user, cohortId) };
}

export async function pinChat(cohortId: string, messageId: string, pinned: boolean): Promise<Result> {
  const { db, user } = await access(cohortId);
  if (!(await pinChatMessage(db, user, cohortId, messageId, pinned))) return { error: "Only the teacher can pin messages." };
  return { messages: await chatMessagesFor(db, user, cohortId) };
}
