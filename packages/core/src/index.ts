/**
 * FormDrop domain logic.
 *
 * Pure functions only — no database, no network, no environment. That is what
 * lets the whole package be unit tested without a connection string, and what
 * keeps the same rules identical across `apps/web` and `apps/api` instead of
 * being reimplemented in each.
 */
export { isDomainAllowed } from "./domain.ts";
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
  resolveNotificationTargets,
  type NotificationForm,
  type NotificationTargets,
} from "./notifications.ts";
