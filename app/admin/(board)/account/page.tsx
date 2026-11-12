import { PageTitle, Panel, Pill } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { roleInfo } from "@/lib/admin/roles";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await requireAdmin();
  return (
    <>
      <PageTitle title="My account" />
      <Panel className="max-w-2xl p-6">
        <p className="font-display text-lg font-semibold text-ink">{session.name}</p>
        {session.email && <p className="text-sm text-muted">{session.email}</p>}
        <div className="mt-3 flex items-start gap-3">
          <Pill tone="blue">{roleInfo[session.role].label}</Pill>
          <p className="text-sm text-muted">{roleInfo[session.role].summary}</p>
        </div>
      </Panel>
      <Panel title="Change password" className="max-w-2xl">
        <div className="px-5 pb-5">
          {session.userId ? (
            <PasswordForm />
          ) : (
            <p className="text-sm text-muted">The super admin password is ADMIN_PASSWORD in the website&apos;s environment variables on Vercel. Change it there and redeploy.</p>
          )}
        </div>
      </Panel>
    </>
  );
}
