import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/learn");
  return (
    <AppShell
      user={user}
      home="/learn"
      items={[
        { href: "/learn", label: "My learning", exact: true },
        { href: "/learn/badges", label: "Badges & certificates" },
        { href: "/", label: "All courses", exact: true },
      ]}
    >
      {children}
    </AppShell>
  );
}
