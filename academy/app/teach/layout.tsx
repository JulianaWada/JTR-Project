import { count, isNull } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { requireTeacher } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

export default async function TeachLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTeacher();
  const db = await getDb();
  const [{ value: toMark }] = await db.select({ value: count() }).from(schema.submissions).where(isNull(schema.submissions.grade));
  return (
    <AppShell
      user={user}
      home="/teach"
      area="Teaching"
      items={[
        { href: "/teach", label: "Overview", icon: "grid", exact: true },
        { href: "/teach/courses", label: "Courses & intakes", icon: "book" },
        { href: "/teach/marking", label: "Marking", icon: "check", badge: toMark },
        { href: "/teach/payments", label: "Payments", icon: "wallet" },
        { href: "/teach/tutor", label: "Tutor questions", icon: "sparkles" },
        { href: "/teach/outbox", label: "Emails", icon: "mail" },
      ]}
    >
      {children}
    </AppShell>
  );
}
