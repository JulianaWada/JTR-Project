import "server-only";

type Bucket = { count: number; resetAt: number };

/**
 * Basic fixed-window rate limiter kept in memory, per server instance.
 * Good enough to stop casual abuse. For strict limits across many serverless
 * instances, back this with a shared store such as Upstash Redis or Vercel KV.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>();

  return function check(key: string) {
    const now = Date.now();
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, remaining: limit - 1, retryAfter: 0 };
    }
    bucket.count += 1;
    const ok = bucket.count <= limit;
    return { ok, remaining: Math.max(0, limit - bucket.count), retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  };
}

export function clientIp(headers: Headers) {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
