import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { formatDateTime } from "@/lib/time";

// The class chat: one group chat per intake, for its paid students and the teacher.
// Access (active enrolment, or the teacher) is checked by the callers with requireCohortAccess.

export const CHAT_MAX_LENGTH = 1000;
/** Messages a student can send per minute, so one person can't flood the chat. */
export const CHAT_PER_MINUTE = 10;
/** How many of the latest messages the chat shows. */
const CHAT_HISTORY = 300;

type User = Pick<typeof schema.users.$inferSelect, "id" | "role">;

/** One message as the chat window shows it. Plain values only: it is sent to the browser. */
export type ChatMessageView = {
  id: string;
  body: string;
  author: string;
  fromTeacher: boolean;
  mine: boolean;
  pinned: boolean;
  canDelete: boolean;
  when: string;
};

export async function postChatMessage(db: Database, user: User, cohortId: string, text: string): Promise<{ error: string } | { id: string }> {
  const body = text.trim();
  if (!body) return { error: "Write a message first." };
  if (body.length > CHAT_MAX_LENGTH) return { error: `Please keep messages under ${CHAT_MAX_LENGTH} characters.` };
  if (user.role !== "teacher") {
    const [{ value: recent }] = await db
      .select({ value: count() })
      .from(schema.chatMessages)
      .where(and(eq(schema.chatMessages.userId, user.id), gte(schema.chatMessages.createdAt, new Date(Date.now() - 60_000))));
    if (recent >= CHAT_PER_MINUTE) return { error: "You're sending messages very fast. Please wait a minute." };
  }
  const [message] = await db.insert(schema.chatMessages).values({ cohortId, userId: user.id, body }).returning({ id: schema.chatMessages.id });
  return message;
}

/** The latest messages of an intake's chat, oldest first, as `viewer` sees them. */
export async function chatMessagesFor(db: Database, viewer: User, cohortId: string): Promise<ChatMessageView[]> {
  const rows = await db
    .select({ message: schema.chatMessages, name: schema.users.name, role: schema.users.role })
    .from(schema.chatMessages)
    .innerJoin(schema.users, eq(schema.users.id, schema.chatMessages.userId))
    .where(eq(schema.chatMessages.cohortId, cohortId))
    .orderBy(desc(schema.chatMessages.createdAt))
    .limit(CHAT_HISTORY);
  return rows.reverse().map(({ message, name, role }) => ({
    id: message.id,
    body: message.body,
    author: name,
    fromTeacher: role === "teacher",
    mine: message.userId === viewer.id,
    pinned: message.pinned,
    canDelete: viewer.role === "teacher" || message.userId === viewer.id,
    when: formatDateTime(message.createdAt),
  }));
}

/** Students can remove their own messages; the teacher can remove any. */
export async function deleteChatMessage(db: Database, user: User, cohortId: string, messageId: string): Promise<boolean> {
  const message = await db.query.chatMessages.findFirst({
    where: and(eq(schema.chatMessages.id, messageId), eq(schema.chatMessages.cohortId, cohortId)),
  });
  if (!message || (user.role !== "teacher" && message.userId !== user.id)) return false;
  await db.delete(schema.chatMessages).where(eq(schema.chatMessages.id, messageId));
  return true;
}

/** Only the teacher pins messages, e.g. house rules or an important link, so they stay at the top. */
export async function pinChatMessage(db: Database, user: User, cohortId: string, messageId: string, pinned: boolean): Promise<boolean> {
  if (user.role !== "teacher") return false;
  const updated = await db
    .update(schema.chatMessages)
    .set({ pinned })
    .where(and(eq(schema.chatMessages.id, messageId), eq(schema.chatMessages.cohortId, cohortId)))
    .returning({ id: schema.chatMessages.id });
  return updated.length > 0;
}

/**
 * Student messages across all class chats in the last day, for the teacher's menu badge.
 * Never throws: a badge must not take the whole teacher dashboard down.
 */
export async function recentStudentMessages(db: Database, cohortIds: string[] | null = null, now = new Date()): Promise<number> {
  if (cohortIds && !cohortIds.length) return 0;
  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(schema.chatMessages)
      .innerJoin(schema.users, eq(schema.users.id, schema.chatMessages.userId))
      .where(
        and(
          eq(schema.users.role, "student"),
          gte(schema.chatMessages.createdAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)),
          cohortIds ? inArray(schema.chatMessages.cohortId, cohortIds) : undefined,
        ),
      );
    return value;
  } catch (err) {
    console.error("[chat] Couldn't count new chat messages:", err);
    return 0;
  }
}
