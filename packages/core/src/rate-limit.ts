/**
 * Fixed-window rate limiting (PRD W2: "per-form on collect, per-key on /v1").
 *
 * A counter per key per window, held in memory. No Redis and no new service,
 * for the same reason D8 chose a Postgres table over a queue: this product
 * does not have the traffic to justify infrastructure, and the failure mode of
 * adding it is worse than the problem.
 *
 * Two consequences worth being plain about.
 *
 * It is per instance. Two API processes each allow the configured rate, so the
 * real ceiling is the limit times the instance count. That is fine for what
 * this defends against -- a single client hammering one endpoint -- and wrong
 * for billing-grade quota enforcement, which is what `quota.ts` is for and
 * which counts in the database.
 *
 * A fixed window lets a caller send the whole allowance at the end of one
 * window and again at the start of the next. A sliding window would smooth
 * that, at the cost of keeping every timestamp rather than one counter. For a
 * limit whose job is to stop floods rather than to meter precisely, the burst
 * is acceptable and the memory saving is not.
 */
export interface RateLimitResult {
  allowed: boolean;
  /** Requests still available in the current window. */
  remaining: number;
  /** When the window resets, as epoch milliseconds. */
  resetAt: number;
  /** Seconds until reset, for a Retry-After header. Zero when allowed. */
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  /** Requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

interface Window {
  count: number;
  resetAt: number;
}

/**
 * The limits themselves.
 *
 * Collect is the endpoint in the wild, so its limit is generous: a contact
 * form receiving one submission a second sustained is already extraordinary,
 * and the point is to stop a flood rather than to shape normal traffic.
 *
 * The authenticated API is per key, where a caller is a script and a higher
 * ceiling is reasonable.
 */
export const COLLECT_LIMIT: RateLimitOptions = { limit: 60, windowMs: 60_000 };
export const API_KEY_LIMIT: RateLimitOptions = { limit: 120, windowMs: 60_000 };

export class RateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(private readonly options: RateLimitOptions) {}

  /**
   * Counts one request against `key` and says whether to serve it.
   *
   * `now` is a parameter so the schedule can be tested without waiting a
   * minute of real time for a window to roll.
   */
  check(key: string, now: number = Date.now()): RateLimitResult {
    const existing = this.windows.get(key);

    if (!existing || now >= existing.resetAt) {
      const resetAt = now + this.options.windowMs;
      this.windows.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: this.options.limit - 1,
        resetAt,
        retryAfterSeconds: 0,
      };
    }

    if (existing.count >= this.options.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
        // Rounded up: a Retry-After of 0 invites an immediate retry that is
        // certain to be refused again.
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.resetAt - now) / 1000),
        ),
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: this.options.limit - existing.count,
      resetAt: existing.resetAt,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Drops windows that have already expired.
   *
   * Without this the map grows by one entry per distinct key forever, and the
   * keys here are form ids and API keys -- unbounded over a long-running
   * process. Called on a timer by the caller rather than on every check, so a
   * request never pays for a scan of the whole map.
   */
  sweep(now: number = Date.now()): number {
    let removed = 0;
    for (const [key, window] of this.windows) {
      if (now >= window.resetAt) {
        this.windows.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  /** Live window count, for tests and diagnostics. */
  get size(): number {
    return this.windows.size;
  }
}
