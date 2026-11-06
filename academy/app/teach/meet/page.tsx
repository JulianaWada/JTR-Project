import type { Metadata } from "next";
import Link from "next/link";
import { MeetLinkCard } from "@/components/meet-link-card";
import { Empty, Flash, PageTitle, TestModeBanner } from "@/components/ui";
import { modes } from "@/lib/env";
import { getDb } from "@/lib/db";
import { liveIntakes } from "@/lib/meet-links";

export const metadata: Metadata = { title: "Class rooms" };

export default async function MeetLinks({ searchParams }: PageProps<"/teach/meet">) {
  const intakes = await liveIntakes(await getDb());
  return (
    <>
      <PageTitle eyebrow="Live classes" title="Class rooms">
        Every live intake has its own private JTR class room inside the academy, so there is nothing to set up. Only students who paid for that intake
        can come in. If you ever want to teach an intake on Google Meet or Zoom instead, choose &quot;An outside link&quot; and paste it.
      </PageTitle>
      {modes().video === "test" && (
        <div className="mb-6">
          <TestModeBanner>
            The class room is in test mode: video starts once DAILY_API_KEY is added in Vercel (academy project). Until then students see a preview.
          </TestModeBanner>
        </div>
      )}
      <Flash searchParams={searchParams} />
      {intakes.length === 0 ? (
        <Empty>
          No upcoming live intakes. Open one from <Link href="/teach/courses" className="text-primary hover:underline">Courses &amp; intakes</Link>.
        </Empty>
      ) : (
        <div className="space-y-4">
          {intakes.map((intake) => (
            <MeetLinkCard key={intake.cohort.id} intake={intake} returnTo="/teach/meet" />
          ))}
        </div>
      )}
    </>
  );
}
