/**
 * FormDrop domain logic.
 *
 * This entry point is pure functions only — no database, no network, no
 * environment. That is what lets it be unit tested without a connection string,
 * and what keeps the same rules identical across `apps/web` and `apps/api`
 * instead of being reimplemented in each.
 *
 * Data access lives behind `@formdrop/core/data`, which does need a database.
 * The split is deliberate: the import path says whether a caller can run
 * without `DATABASE_URL`.
 *
 * Pure also means browser-safe: apps/web bundles this entry for the client,
 * so a Node builtin reaching it breaks that build. api-key.ts is the case in
 * point -- it needs node:crypto, so it is used from `/data` and deliberately
 * not re-exported here.
 */
export { isDomainAllowed, isRequestOriginAllowed } from "./domain.ts";
export {
  planFor,
  quotaFor,
  submissionLimit,
  SUBMISSION_LIMITS,
  type Plan,
  type Quota,
} from "./quota.ts";
export { usagePeriod } from "./period.ts";
export {
  changePercent,
  lastCompletedPeriod,
  previousPeriod,
  type ReportFrequency,
  type ReportPeriod,
} from "./report-period.ts";
export { generateFormSlug, SLUG_LENGTH } from "./slug.ts";
export {
  resolveNotificationTargets,
  type NotificationForm,
  type NotificationTargets,
} from "./notifications.ts";
export {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  pageSize,
  type SubmissionCursor,
} from "./cursor.ts";
export {
  MAX_ATTEMPTS,
  isExhausted,
  nextAttemptDelayMs,
  plannedDeliveries,
  type OutboxChannel,
  type PlannedDelivery,
} from "./outbox.ts";
export {
  API_KEY_LIMIT,
  COLLECT_LIMIT,
  RateLimiter,
  type RateLimitOptions,
  type RateLimitResult,
} from "./rate-limit.ts";
