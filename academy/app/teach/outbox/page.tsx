import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { Empty, Flash, PageTitle, Pill } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { modes } from "@/lib/env";
import { formatDateTime } from "@/lib/time";
import { sendTestEmail } from "../actions";

export const metadata: Metadata = { title: "Emails" };

export default async function Outbox({ searchParams }: PageProps<"/teach/outbox">) {
  const user = await requireTeacher();
  const db = await getDb();
  const rows = await db.query.emails.findMany({ orderBy: desc(schema.emails.createdAt), limit: 100 });
  return (
    <>
      <PageTitle eyebrow="Teacher" title="Emails sent by the academy">
        Receipts, class reminders, marking results and certificates.{" "}
        {modes().email === "test" ? "Test mode: these were not actually sent. Add a Resend API key to send them." : ""}
      </PageTitle>
      <Flash searchParams={searchParams} />
      <form action={sendTestEmail} className="card mb-6 flex flex-wrap items-end gap-3">
        <label className="min-w-64 flex-1">
          <span className="text-sm font-medium text-ink">Send a test email to</span>
          <input className="input mt-1" name="to" type="email" required defaultValue={user.email} />
        </label>
        <button className="btn-primary">Send test email</button>
        <p className="w-full text-xs text-muted">Checks that real emails leave the academy and arrive. It appears in the list below too.</p>
      </form>
      {rows.length === 0 ? (
        <Empty>No emails yet.</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map((e) => (
            <li key={e.id}>
              <details className="card">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-medium text-ink">{e.subject}</span>
                    <span className="block text-xs text-muted">
                      To {e.to} · {formatDateTime(e.createdAt)}
                    </span>
                  </span>
                  {e.error ? <Pill tone="danger">Failed</Pill> : e.mode === "test" ? <Pill tone="warning">Test, not sent</Pill> : <Pill tone="success">Sent</Pill>}
                </summary>
                <pre className="mt-4 rounded-xl bg-surface-2 p-4 font-sans text-sm whitespace-pre-wrap text-ink">{e.body}</pre>
                {e.error && <p className="mt-2 text-sm text-danger">{e.error}</p>}
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
