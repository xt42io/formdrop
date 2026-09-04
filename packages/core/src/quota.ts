/**
 * Submission quota, lifted out of the user-settings route handler where it was
 * a hardcoded ternary with a comment reading "ideally from config".
 *
 * NOTE: these numbers contradict the marketing copy. The pricing page lists
 * "Unlimited Submissions" on the free plan and "Unlimited submissions" on Pro,
 * and the hero says "unlimited forms and submissions". The product has always
 * reported a 100 / 10,000 cap here. The values are carried over unchanged
 * rather than reconciled, because deciding which side is right is a product
 * call, not a refactor.
 */
export const SUBMISSION_LIMITS = {
  free: 100,
  pro: 10_000,
} as const;

export type Plan = keyof typeof SUBMISSION_LIMITS;

/** Polar reports an active subscription as "active"; everything else is free. */
export function planFor(subscriptionStatus: string | null | undefined): Plan {
  return subscriptionStatus === "active" ? "pro" : "free";
}

export function submissionLimit(plan: Plan): number {
  return SUBMISSION_LIMITS[plan];
}

export interface Quota {
  plan: Plan;
  used: number;
  limit: number;
  remaining: number;
  exceeded: boolean;
}

export function quotaFor(
  subscriptionStatus: string | null | undefined,
  used: number,
): Quota {
  const plan = planFor(subscriptionStatus);
  const limit = submissionLimit(plan);

  return {
    plan,
    used,
    limit,
    // Clamped: a user who is over their limit has none left, not a negative
    // number to render in the dashboard.
    remaining: Math.max(0, limit - used),
    exceeded: used >= limit,
  };
}
