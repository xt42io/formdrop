import { Elysia } from "elysia";
import {
  API_KEY_LIMIT,
  COLLECT_LIMIT,
  RateLimiter,
  type RateLimitResult,
} from "@formdrop/core";

/**
 * Rate limiting, applied where W2 asks for it: "per-form on collect, per-key
 * on /v1".
 *
 * Two limiters rather than one, because the two are different populations. A
 * form id identifies somebody else's website receiving submissions; an API key
 * identifies a script the account owns. Sharing a limiter would let a busy
 * form throttle its owner's API calls, which are unrelated.
 *
 * Deliberately *not* per IP on collect. The whole point of `POST /f/:slug` is
 * that strangers post to it from wherever they are, and limiting by IP would
 * throttle a shared NAT or a corporate proxy as though it were one visitor.
 * The form is what needs protecting from a flood, so the form is the key.
 */
const collectLimiter = new RateLimiter(COLLECT_LIMIT);
const apiKeyLimiter = new RateLimiter(API_KEY_LIMIT);

/**
 * Expired windows are dropped on a timer rather than during a request.
 *
 * The keys are form ids and API keys, so the map would otherwise grow by one
 * entry per distinct caller for the life of the process. Sweeping inside
 * `check` would make one unlucky request pay for scanning the whole map.
 */
const SWEEP_INTERVAL_MS = 5 * 60_000;

const sweep = setInterval(() => {
  collectLimiter.sweep();
  apiKeyLimiter.sweep();
}, SWEEP_INTERVAL_MS);

// The sweep must not be the reason a process refuses to exit.
sweep.unref?.();

/** The headers a well-behaved client uses to pace itself. */
function limitHeaders(result: RateLimitResult, limit: number) {
  return {
    "x-ratelimit-limit": String(limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function checkCollectLimit(formId: string) {
  return collectLimiter.check(formId);
}

export function collectLimitHeaders(result: RateLimitResult) {
  return limitHeaders(result, COLLECT_LIMIT.limit);
}

/**
 * Refuses an over-rate API-key request before its handler runs.
 *
 * A scoped onBeforeHandle rather than a per-route macro. Every route in a
 * group it is applied to is covered automatically, so adding a route cannot
 * quietly add an unlimited one -- which is exactly the mistake an opt-in flag
 * invites.
 */
export const rateLimitByApiKey = new Elysia({
  name: "rate-limit-by-api-key",
}).onBeforeHandle({ as: "scoped" }, ({ headers, set, status }) => {
  const presented = headers.authorization?.replace("Bearer ", "");

  // A missing key is not this plugin's business -- the auth macro answers 401
  // for it. Counting the attempt anyway would let an unauthenticated caller
  // burn through a window that is not theirs.
  if (!presented) return;

  const result = apiKeyLimiter.check(presented);
  Object.assign(set.headers, limitHeaders(result, API_KEY_LIMIT.limit));

  if (!result.allowed) {
    set.headers["retry-after"] = String(result.retryAfterSeconds);
    return status(429, { error: "Rate limit exceeded" });
  }
});
