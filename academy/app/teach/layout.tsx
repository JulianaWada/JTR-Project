import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { requireTeacher } from "@/lib/auth";
import { recentStudentMessages } from "@/lib/chat";
import { getDb, schema } from "@/lib/db";
import { needsLink } from "@/lib/class-room";
import { liveIntakes } from "@/lib/meet-links";
import { brandFor, ownCohortIds } from "@/lib/teachers";

export default async function TeachLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTeacher();
  const db = await getDb();
  const cohortIds = await ownCohortIds(db, user);
  const [{ value: toMark }] =
    cohortIds && !cohortIds.length
      ? [{ value: 0 }]
      : await db
          .select({ value: count() })
          .from(schema.submissions)
          .where(and(isNull(schema.submissions.grade), cohortIds ? inArray(schema.submissions.cohortId, cohortIds) : undefined));
  const newChat = await recentStudentMessages(db, cohortIds);
  const noMeetLink = (await liveIntakes(db, undefined, user)).filter((i) => needsLink(i.cohort)).length;
  const pending = user.isAdmin
    ? (await db.select({ value: count() }).from(schema.teacherProfiles).where(eq(schema.teacherProfiles.status, "pending")))[0].value
    : 0;
  const brand = user.isAdmin ? null : await brandFor(db, user.id);
  return (
    <AppShell
      user={user}
      home="/teach"
      area="Teaching"
      items={[
        { href: "/teach", label: "Overview", icon: "grid", exact: true },
        { href: "/teach/courses", label: "Courses & intakes", icon: "book" },
        { href: "/teach/meet", label: "Class rooms", icon: "video", badge: noMeetLink },
        { href: "/teach/marking", label: "Marking", icon: "check", badge: toMark },
        { href: "/teach/payments", label: user.isAdmin ? "Payments" : "Sales", icon: "wallet" },
        { href: "/teach/chat", label: "Class chats", icon: "chat", badge: newChat },
        { href: "/teach/tutor", label: "Tutor questions", icon: "sparkles" },
        ...(user.isAdmin
          ? [
              { href: "/teach/teachers", label: "Teachers", icon: "users" as const, badge: pending },
              { href: "/teach/outbox", label: "Emails", icon: "mail" as const },
            ]
          : [{ href: "/teach/profile", label: "My profile & logo", icon: "user" as const }]),
        { href: "/learn/preview", label: "Student view", icon: "eye" },
      ]}
      brand={brand ? { name: brand.name, logo: brand.logo, color: brand.color } : undefined}
    >
      {children}
    </AppShell>
  );
}
