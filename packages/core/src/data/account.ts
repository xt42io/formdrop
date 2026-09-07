import { db } from "@formdrop/db";
import {
  account,
  forms,
  submissions,
  subscriptions,
} from "@formdrop/db/schema";
import { and, count, eq, isNotNull } from "drizzle-orm";

/**
 * Account-level queries: the subscription a user is on, and the counts the
 * settings screen reports against their quota.
 */

/** Polar writes one row per user; absent means free. */
export async function findSubscription(userId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return subscription ?? null;
}

/**
 * Whether the user can sign in with a password at all. Accounts created
 * through Google or GitHub have no password row, and the settings screen hides
 * the change-password form for them.
 */
export async function hasPasswordCredential(userId: string): Promise<boolean> {
  const [passwordAccount] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), isNotNull(account.password)))
    .limit(1);

  return !!passwordAccount;
}

/** Submissions across every form the user owns, for the quota reading. */
export async function countSubmissionsForUser(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(submissions)
    .innerJoin(forms, eq(submissions.formId, forms.id))
    .where(eq(forms.userId, userId));

  return result?.count || 0;
}
