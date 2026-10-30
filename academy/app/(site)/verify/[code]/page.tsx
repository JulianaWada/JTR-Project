import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { asset } from "@/lib/assets";
import { getDb, schema } from "@/lib/db";
import { formatDate } from "@/lib/time";

export const metadata: Metadata = { title: "Certificate check" };

export default async function VerifyCode({ params }: PageProps<"/verify/[code]">) {
  const code = decodeURIComponent((await params).code).toUpperCase();
  const db = await getDb();
  const cert = await db.query.certificates.findFirst({ where: eq(schema.certificates.code, code) });
  const cohort = cert ? await db.query.cohorts.findFirst({ where: eq(schema.cohorts.id, cert.cohortId) }) : undefined;
  const valid = cert && !cert.revokedAt;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="card text-center">
        <p className="text-5xl" aria-hidden>
          {valid ? "✅" : "⚠️"}
        </p>
        {valid ? (
          <>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">This certificate is genuine</h1>
            <dl className="mt-6 space-y-3 text-start">
              {[
                ["Awarded to", cert.studentName],
                ["Course", cert.courseTitle],
                ["Intake", cohort?.name ?? ""],
                ["Issued", formatDate(cert.issuedAt)],
                ["Certificate ID", cert.code],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-line pb-3 text-sm">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-end font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-muted">
              Issued by JTR Academy, Jules TechRight (JTR) Ltd, for completing the live course: attending the classes and passing the final project.
            </p>
            <a href={asset(`/certificates/${cert.code}/pdf`)} className="btn-secondary mt-6">
              View the certificate (PDF)
            </a>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{cert ? "This certificate was withdrawn" : "No certificate with that ID"}</h1>
            <p className="mt-2 text-muted">
              {cert ? "It is no longer valid." : `We couldn't find ${code}. Check the ID on the certificate, or contact JTR.`}
            </p>
            <Link href="/verify" className="btn-secondary mt-6">
              Check another ID
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
