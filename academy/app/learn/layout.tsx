import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/learn");
  return (
    <AppShell
      user={user}
      home="/learn"
      area="Academy"
      items={[
        { href: "/learn", label: "My learning", icon: "home", exact: true },
        { href: "/learn/badges", label: "Badges & certificates", icon: "award" },
        ...(user.role === "teacher" ? [{ href: "/teach", label: "Teacher dashboard", icon: "grid" as const, exact: true }] : []),
      ]}
    >
      {children}
    </AppShell>
  );
}
