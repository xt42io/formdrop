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
