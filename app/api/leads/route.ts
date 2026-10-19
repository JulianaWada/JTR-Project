import { NextResponse } from "next/server";
import { saveLead } from "@/lib/leads/handler";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  const rate = limiter(clientIp(request.headers));
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Only the contact form posts here; the assistant calls saveLead() directly on the server.
  const result = await saveLead({ ...(body as object), source: "contact-form" } as Parameters<typeof saveLead>[0]);
  if (result.ok || result.error === "spam") return NextResponse.json({ ok: true });
  if (result.error === "invalid") return NextResponse.json({ ok: false, error: "invalid", issues: result.issues }, { status: 400 });
  return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
}
