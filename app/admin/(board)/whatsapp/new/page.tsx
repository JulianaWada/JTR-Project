import { PageTitle, Panel, SampleNotice } from "@/components/admin/ui";
import { whatsappAppUrl, whatsappMode } from "@/lib/admin/sources/whatsapp";
import { AddBusinessForm } from "./AddBusinessForm";

export const metadata = { title: "Add a business" };

export default function NewBusinessPage() {
  return (
    <>
      <PageTitle title="Add a business" subtitle="Creates the business on the WhatsApp sales agent and a dashboard login for the owner." />
      {whatsappMode() === "sample" && (
        <SampleNotice>The sales agent isn&apos;t connected yet, so this business is only added to the sample list.</SampleNotice>
      )}
      <Panel className="max-w-3xl p-6">
        <AddBusinessForm appUrl={whatsappAppUrl()} />
      </Panel>
    </>
  );
}
