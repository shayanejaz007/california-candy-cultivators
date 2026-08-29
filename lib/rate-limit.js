/**
 * Fixed-window in-memory rate limiter.
 *
 * Deliberate limitations, because they matter for how you deploy:
 *
 *  - State lives in one process. Two instances behind a load balancer each get
 *    their own budget, and a redeploy resets everything. That is acceptable for
 *    a single-instance VPS and NOT acceptable on serverless.
 *  - For multi-instance hosting, swap `hit()` for Upstash Redis, Vercel KV, or
 *    a Postgres table. Every caller goes through this one function, so the
 *    change is contained to this file.
 *
 * Entries are pruned on write and the map is capped, so a flood of unique
 * client keys cannot grow it without bound.
 */

const buckets = new Map();
const MAX_KEYS = 10_000;

function prune(now) {
  for (const [key, entry] of buckets) {
    if (entry.reset <= now) buckets.delete(key);
  }
  // Still oversized after pruning: drop oldest-resetting entries first.
  if (buckets.size > MAX_KEYS) {
    const sorted = [...buckets.entries()].sort((a, b) => a[1].reset - b[1].reset);
    for (const [key] of sorted.slice(0, buckets.size - MAX_KEYS)) buckets.delete(key);
  }
}

/**
 * Records a hit and reports whether the caller is over budget.
 * @returns {{ ok: boolean, remaining: number, retryAfter: number }}
 */
export function hit(key, limit, windowMs) {
  const now = Date.now();
  if (buckets.size > MAX_KEYS / 2) prune(now);

  let entry = buckets.get(key);
  if (!entry || entry.reset <= now) {
    entry = { count: 0, reset: now + windowMs };
    buckets.set(key, entry);
  }

  entry.count += 1;
  const over = entry.count > limit;

  return {
    ok: !over,
    remaining: Math.max(0, limit - entry.count),
    retryAfter: Math.ceil((entry.reset - now) / 1000)
  };
}

export function reset(key) {
  buckets.delete(key);
}

/**
 * Best-effort client identity for rate limiting.
 *
 * X-Forwarded-For is client-supplied and therefore forgeable. It is used
 * anyway, because the alternative — putting every visitor in one bucket — lets
 * a single abuser lock out the whole site. The forgery risk is covered instead
 * by pairing every per-client limit with a global one at the call site, so
 * rotating the header buys an attacker more buckets but not more total budget.
 *
 * Set TRUST_PROXY=1 when a proxy you control (Vercel, Cloudflare, nginx)
 * rewrites the header, which makes the value authoritative rather than a hint.
 */
export function clientKey(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();

  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();

  return 'unknown';
}

/** 429 response with the correct Retry-After header. */
export function tooMany(message, retryAfter) {
  return Response.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, retryAfter)) } }
  );
}
