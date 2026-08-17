import "server-only";

import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

// In-memory fixed-window limiter. Adequate for a single-node deployment and for
// development; swap the Map for Redis/Upstash when the app runs on more than one
// instance — the call sites stay identical.
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfter: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

/** Best-effort client identity for rate limiting. */
export async function clientKey(scope: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  return `${scope}:${ip}`;
}

// Opportunistic cleanup so the Map cannot grow without bound.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 60_000);
  // Do not hold the process open in serverless/edge-ish runtimes.
  (timer as unknown as { unref?: () => void }).unref?.();
}
