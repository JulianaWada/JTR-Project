import { NotConnected, PageTitle, Panel } from "@/components/admin/ui";
import { whatsappAppUrl, whatsappMode } from "@/lib/admin/sources/whatsapp";
import { AddBusinessForm } from "./AddBusinessForm";

export const metadata = { title: "Add a business" };

export default function NewBusinessPage() {
  return (
    <>
      <PageTitle title="Add a business" subtitle="Creates the business on the WhatsApp sales agent and a dashboard login for the owner." />
      {whatsappMode() === "off" ? (
        <NotConnected app="The WhatsApp sales agent" envVar="WHATSAPP_AGENT_DATABASE_URL" />
      ) : (
        <Panel className="max-w-3xl p-6">
          <AddBusinessForm appUrl={whatsappAppUrl()} />
        </Panel>
      )}
    </>
  );
}
