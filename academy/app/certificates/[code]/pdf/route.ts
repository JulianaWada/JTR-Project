import { eq } from "drizzle-orm";
import { certificatePdf } from "@/lib/certificates";
import { getDb, schema } from "@/lib/db";

// Public on purpose: the code is the certificate's ID, printed on it and shared by the student.
export async function GET(_request: Request, { params }: RouteContext<"/certificates/[code]/pdf">) {
  const { code } = await params;
  const db = await getDb();
  const cert = await db.query.certificates.findFirst({ where: eq(schema.certificates.code, code.toUpperCase()) });
  if (!cert || cert.revokedAt) return new Response("Certificate not found", { status: 404 });
  const bytes = await certificatePdf(cert);
  const filename = `JTR-Academy-${cert.courseTitle.replace(/[^a-z0-9]+/gi, "-")}-${cert.code}.pdf`;
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
