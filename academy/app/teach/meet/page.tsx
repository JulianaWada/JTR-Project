import type { Metadata } from "next";
import Link from "next/link";
import { MeetLinkCard } from "@/components/meet-link-card";
import { Empty, Flash, PageTitle } from "@/components/ui";
import { getDb } from "@/lib/db";
import { liveIntakes } from "@/lib/meet-links";

export const metadata: Metadata = { title: "Google Meet links" };

export default async function MeetLinks({ searchParams }: PageProps<"/teach/meet">) {
  const intakes = await liveIntakes(await getDb());
  return (
    <>
      <PageTitle eyebrow="Live classes" title="Google Meet links">
        Paste the Google Meet link for each live intake. Create the meeting in Google Calendar or at meet.google.com, copy its link and paste it here.
      </PageTitle>
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
