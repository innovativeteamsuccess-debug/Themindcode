/* ============================================================
   Sliding-window rate limiter (in-memory, per process).

   The site runs as a single standalone Node process, so an
   in-memory map is exact here — no external cache needed. It
   protects the expensive AI endpoints (token burn) and the
   public enquiry form (spam flood) from scripted abuse while
   staying invisible to real students.

   Usage:
     const hit = rateLimit(`code:${user.id}`, 20, 10 * 60_000);
     if (!hit) return tooMany();

   Buckets are swept lazily so the map can never grow unbounded.
   ============================================================ */

type Bucket = number[]; // hit timestamps inside the current window

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60_000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    // drop buckets whose newest hit is older than 1 h
    if (hits.length === 0 || now - hits[hits.length - 1] > 3_600_000) {
      buckets.delete(key);
    }
  }
}

/** Record a hit for `key`; returns false when over `limit` inside `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);

  let hits = buckets.get(key);
  if (!hits) {
    hits = [];
    buckets.set(key, hits);
  }
  const cutoff = now - windowMs;
  while (hits.length > 0 && hits[0] <= cutoff) hits.shift();

  if (hits.length >= limit) return false;
  hits.push(now);
  return true;
}

/** Seconds until the oldest hit in the window expires (for Retry-After). */
export function retryAfterSeconds(windowMs: number): number {
  return Math.max(1, Math.ceil(windowMs / 1000));
}

/** Standard 429 JSON response with a Retry-After header. */
export function tooMany(windowMs = 10 * 60_000, message?: string): Response {
  return Response.json(
    {
      ok: false,
      code: "rate_limited",
      error:
        message ??
        "Slow down for a moment — the engines are cooling. Try again shortly.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds(windowMs)),
        "Cache-Control": "no-store",
      },
    }
  );
}

/** Best-effort client IP behind the preview proxy chain. */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local"
  );
}
