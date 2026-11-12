import { NotConnected, PageTitle, Panel } from "@/components/admin/ui";
import { whatsappAppUrl, whatsappMode } from "@/lib/admin/sources/whatsapp";
import { requireAdmin } from "@/lib/admin/auth";
import { can } from "@/lib/admin/roles";
import { AddBusinessForm } from "./AddBusinessForm";

export const metadata = { title: "Add a business" };

export default async function NewBusinessPage() {
  const session = await requireAdmin();
  return (
    <>
      <PageTitle title="Add a business" subtitle="Creates the business on the WhatsApp sales agent and a dashboard login for the owner." />
      {!can(session.role, "whatsapp.add") ? (
        <Panel className="max-w-3xl p-6 text-sm text-muted">Your role can&apos;t add businesses. Ask the super admin if you need it.</Panel>
      ) : whatsappMode() === "off" ? (
        <NotConnected app="The WhatsApp sales agent" envVar="WHATSAPP_AGENT_DATABASE_URL" />
      ) : (
        <Panel className="max-w-3xl p-6">
          <AddBusinessForm appUrl={whatsappAppUrl()} />
        </Panel>
      )}
    </>
  );
}
