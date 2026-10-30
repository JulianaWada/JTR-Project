import { AppShell } from "@/components/app-shell";
import { requireTeacher } from "@/lib/auth";

export default async function TeachLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTeacher();
  return (
    <AppShell
      user={user}
      home="/teach"
      items={[
        { href: "/teach", label: "Overview", exact: true },
        { href: "/teach/courses", label: "Courses & intakes" },
        { href: "/teach/marking", label: "Marking" },
        { href: "/teach/payments", label: "Payments" },
        { href: "/teach/tutor", label: "Tutor questions" },
        { href: "/teach/outbox", label: "Emails" },
      ]}
    >
      {children}
    </AppShell>
  );
}
