import { desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Empty, Flash, PageTitle, Pill } from "@/components/ui";
import { asset } from "@/lib/assets";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { brandFromProfile, STATUS_LABEL } from "@/lib/teachers";
import { formatDate } from "@/lib/time";
import { review } from "./actions";

export const metadata: Metadata = { title: "Teachers" };

const tone = { pending: "warning", approved: "success", rejected: "neutral", suspended: "danger" } as const;

export default async function Teachers({ searchParams }: PageProps<"/teach/teachers">) {
  await requireAdmin();
  const db = await getDb();
  const rows = await db
    .select({ profile: schema.teacherProfiles, user: schema.users })
    .from(schema.teacherProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.teacherProfiles.userId))
    .orderBy(desc(schema.teacherProfiles.appliedAt));
  const courses = rows.length
    ? await db.query.courses.findMany({ where: inArray(schema.courses.teacherId, rows.map((r) => r.user.id)) })
    : [];
  const pending = rows.filter((r) => r.profile.status === "pending");
  const others = rows.filter((r) => r.profile.status !== "pending");

  return (
    <>
      <PageTitle eyebrow="Admin" title="Teachers">
        Teachers register on the{" "}
        <Link href="/teach-with-us" className="font-medium text-primary hover:underline">
          Teach with JTR
        </Link>{" "}
        page. They can&apos;t open the teacher dashboard until you approve them here. Approved teachers manage only their own courses, students and
        materials; you see everything.
      </PageTitle>
      <Flash searchParams={searchParams} />

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Waiting for approval {pending.length > 0 && <span className="text-muted">({pending.length})</span>}</h2>
        {pending.length === 0 ? (
          <div className="mt-3">
            <Empty>No applications waiting. Share the Teach with JTR page to invite teachers.</Empty>
          </div>
        ) : (
          <ul className="mt-3 space-y-4">
            {pending.map(({ profile, user }) => (
              <li key={user.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">{profile.brandName || user.name}</p>
                    <p className="text-sm text-muted">
                      {user.name} · {user.email}
                      {user.phone ? ` · ${user.phone}` : ""} · applied {formatDate(profile.appliedAt)}
                    </p>
                  </div>
                  <Pill tone="warning">{STATUS_LABEL.pending}</Pill>
                </div>
                {profile.headline && <p className="mt-3 text-sm font-medium text-ink">{profile.headline}</p>}
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-ink">Wants to teach</dt>
                    <dd className="mt-1 whitespace-pre-line text-muted">{profile.subjects}</dd>
                  </div>
                  {profile.bio && (
                    <div>
                      <dt className="font-medium text-ink">Experience</dt>
                      <dd className="mt-1 whitespace-pre-line text-muted">{profile.bio}</dd>
                    </div>
                  )}
                  {profile.website && (
                    <div>
                      <dt className="font-medium text-ink">Link</dt>
                      <dd className="mt-1">
                        <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-primary hover:underline">
                          {profile.website}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                  <form action={review.bind(null, user.id, "approve")}>
                    <button className="btn-primary">Approve</button>
                  </form>
                  <form action={review.bind(null, user.id, "reject")} className="flex min-w-64 flex-1 flex-wrap items-end gap-2">
                    <label className="min-w-48 flex-1">
                      <span className="sr-only">Reason (optional, sent to them)</span>
                      <input className="input" name="note" placeholder="Reason for declining (optional, emailed to them)" maxLength={1000} />
                    </label>
                    <button className="btn-secondary">Decline</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-8 overflow-x-auto">
        <h2 className="font-display text-lg font-semibold text-ink">All teachers</h2>
        {others.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No approved teachers yet.</p>
        ) : (
          <table className="table mt-3">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Status</th>
                <th>Courses</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {others.map(({ profile, user }) => {
                const brand = brandFromProfile(profile, user.name);
                const theirs = courses.filter((c) => c.teacherId === user.id);
                return (
                  <tr key={user.id}>
                    <td>
                      <span className="flex items-center gap-3">
                        {brand.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element -- uploaded logo
                          <img src={asset(brand.logo)} alt="" width={36} height={36} className="size-9 rounded-lg border border-line bg-white object-contain" />
                        ) : (
                          <span className="grid size-9 place-items-center rounded-lg text-sm font-bold text-white" style={{ background: brand.color }}>
                            {brand.name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span>
                          <span className="block font-medium text-ink">{brand.name}</span>
                          <span className="text-xs text-muted">
                            {user.name} · {user.email}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <Pill tone={tone[profile.status]}>{STATUS_LABEL[profile.status]}</Pill>
                    </td>
                    <td className="text-sm text-muted">
                      {theirs.length
                        ? theirs.map((c) => (
                            <Link key={c.id} href={`/teach/courses/${c.id}`} className="block text-primary hover:underline">
                              {c.title}
                              {!c.published && " (draft)"}
                            </Link>
                          ))
                        : "None yet"}
                    </td>
                    <td className="text-end">
                      {profile.status === "approved" ? (
                        <form action={review.bind(null, user.id, "suspend")}>
                          <button className="text-sm font-medium text-danger hover:underline">Suspend</button>
                        </form>
                      ) : (
                        <form action={review.bind(null, user.id, "approve")}>
                          <button className="text-sm font-medium text-primary hover:underline">{profile.status === "suspended" ? "Reinstate" : "Approve"}</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
