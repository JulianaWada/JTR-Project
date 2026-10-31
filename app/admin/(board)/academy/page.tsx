import Link from "next/link";
import { NotConnected, PageTitle, Panel, Pill, Stat, Table, Td, humanise, statusTone } from "@/components/admin/ui";
import { formatDate, formatDateTime, formatNaira } from "@/lib/admin/money";
import { siteCounts } from "@/lib/admin/site-data";
import { academyMode, academyTeachUrl, listCohorts, listCourses, listPayments, listStudents } from "@/lib/admin/sources/academy";

export const metadata = { title: "Academy" };

function EditLink({ path, children }: { path: string; children: string }) {
  const href = academyTeachUrl(path);
  return href ? (
    <a href={href} className="text-sm font-semibold text-primary">
      {children}
    </a>
  ) : null;
}

export default async function AcademyPage() {
  let data;
  try {
    const [courses, cohorts, students, payments] = await Promise.all([listCourses(), listCohorts(), listStudents(), listPayments()]);
    data = { courses, cohorts, students, payments };
  } catch (err) {
    console.error("[admin] academy database", err);
  }
  const counts = await siteCounts();
  const paid = data?.payments.filter((p) => p.status === "success") ?? [];

  return (
    <>
      <PageTitle
        title="JTR Academy"
        subtitle="Courses, intakes, students and payments. Edit courses, classes and marking in the academy's own teacher pages."
        actions={<EditLink path="">Open the academy dashboard</EditLink>}
      />
      {academyMode() === "off" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Interest sign-ups" value={counts.allInterest} note={`${counts.newInterest} new`} href="/admin/academy/interest" icon="edtech" tone="violet" />
          </div>
          <NotConnected app="The academy" envVar="ACADEMY_DATABASE_URL">
            Courses, students and payments will appear here. Interest sign-ups already work.
          </NotConnected>
        </>
      ) : !data ? (
        <Panel>
          <p className="p-6 text-sm text-danger">The academy database could not be reached. Check ACADEMY_DATABASE_URL.</p>
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Interest sign-ups" value={counts.allInterest} note={`${counts.newInterest} new`} href="/admin/academy/interest" icon="edtech" tone="violet" />
            <Stat label="Students" value={data.students.length} note={`${data.courses.reduce((n, c) => n + c.activeStudents, 0)} active enrolments`} icon="users" tone="blue" />
            <Stat label="Paid" value={formatNaira(paid.reduce((n, p) => n + p.amountKobo, 0))} note={`${paid.length} payments`} icon="trendingUp" tone="green" />
            <Stat label="Open for enrolment" value={data.cohorts.filter((c) => c.enrolmentOpen).length} note="intakes" icon="calendar" tone="amber" />
          </div>

          <Panel title="Courses">
            <Table head={["Course", "Price", "Intakes", "Active students", "Paid", ""]}>
              {data.courses.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <p className="font-semibold text-ink">{c.title}</p>
                    <p className="text-muted">{c.format === "recorded" ? "Recorded, self-paced" : "Live classes"}</p>
                    {!c.published && <Pill>Hidden</Pill>}
                  </Td>
                  <Td>{formatNaira(c.priceKobo)}</Td>
                  <Td>{c.cohorts}</Td>
                  <Td>{c.activeStudents}</Td>
                  <Td>{formatNaira(c.revenueKobo)}</Td>
                  <Td className="text-right">
                    <EditLink path={`/courses/${c.id}`}>Edit</EditLink>
                  </Td>
                </tr>
              ))}
            </Table>
          </Panel>

          <Panel title="Intakes">
            <Table head={["Intake", "Starts", "Places", "Enrolment", ""]}>
              {data.cohorts.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <p className="font-semibold text-ink">{c.name}</p>
                    <p className="text-muted">{c.course}</p>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(c.startsAt)}</Td>
                  <Td>
                    {c.activeStudents} of {c.capacity}
                    {c.pendingStudents > 0 && <span className="text-muted"> · {c.pendingStudents} awaiting payment</span>}
                  </Td>
                  <Td>
                    <Pill tone={c.enrolmentOpen ? "green" : "neutral"}>{c.enrolmentOpen ? "Open" : "Closed"}</Pill>
                  </Td>
                  <Td className="text-right">
                    <EditLink path={`/cohorts/${c.id}`}>Manage</EditLink>
                  </Td>
                </tr>
              ))}
            </Table>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Students">
              <Table head={["Student", "Courses", "Joined"]} empty="No students yet.">
                {data.students.map((s) => (
                  <tr key={s.id}>
                    <Td>
                      <p className="font-semibold text-ink">{s.name}</p>
                      <p className="text-muted">{s.email}</p>
                      {s.phone && <p className="text-muted">{s.phone}</p>}
                    </Td>
                    <Td>
                      {s.courses || <span className="text-muted">Not enrolled</span>}
                      {s.certificates > 0 && (
                        <div className="mt-1">
                          <Pill tone="green">{s.certificates === 1 ? "Certificate" : `${s.certificates} certificates`}</Pill>
                        </div>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{formatDate(s.createdAt)}</Td>
                  </tr>
                ))}
              </Table>
            </Panel>
            <Panel title="Payments" action={<EditLink path="/payments">All payments</EditLink>}>
              <Table head={["Date", "Student", "Amount", "Status"]} empty="No payments yet.">
                {data.payments.map((p) => (
                  <tr key={p.id}>
                    <Td className="whitespace-nowrap text-muted">{formatDateTime(p.createdAt)}</Td>
                    <Td>
                      <p className="font-semibold text-ink">{p.student}</p>
                      <p className="text-muted">
                        {p.course}, {p.cohort}
                      </p>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {formatNaira(p.amountKobo)}
                      {p.discountCode && <p className="text-muted">Code {p.discountCode}</p>}
                    </Td>
                    <Td>
                      <Pill tone={statusTone(p.status)}>{humanise(p.status)}</Pill>
                      {p.provider === "test" && <p className="mt-1 text-xs text-muted">Test checkout</p>}
                    </Td>
                  </tr>
                ))}
              </Table>
            </Panel>
          </div>
        </>
      )}
      <p className="text-sm text-muted">
        Looking for people who registered interest?{" "}
        <Link href="/admin/academy/interest" className="font-semibold text-primary">
          See the sign-ups
        </Link>
        .
      </p>
    </>
  );
}
