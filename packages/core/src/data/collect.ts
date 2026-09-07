import { db } from "@formdrop/db";
import {
  emailNotificationRecipients,
  forms,
  submissions,
  usage,
  user,
} from "@formdrop/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";

/**
 * The reads and writes behind `POST /f/:slug`.
 *
 * W2 moves the submission pipeline here so the route is left deciding only
 * what to answer, and so the ordering below is stated once rather than
 * reconstructed from a 200-line handler.
 */

/**
 * A form by slug, unscoped and including soft-deleted rows.
 *
 * Both are deliberate. There is no session on this endpoint -- the slug *is*
 * the address -- and a deleted form has to be distinguishable from one that
 * never existed, because the endpoint answers 400 for the first and 404 for
 * the second.
 */
export async function findFormBySlug(slug: string) {
  const [form] = await db
    .select()
    .from(forms)
    .where(eq(forms.slug, slug))
    .limit(1);

  return form ?? null;
}

/** The owner's email, which is always a notification target when email is on. */
export async function findFormOwnerEmail(
  userId: string,
): Promise<string | null> {
  const [owner] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return owner?.email ?? null;
}

/**
 * Recipients that should actually receive mail: switched on *and* verified.
 *
 * Unverified addresses are excluded at the query, not by the caller, so no
 * route can accidentally mail an address nobody confirmed owning.
 */
export function listDeliverableRecipients(formId: string) {
  return db
    .select()
    .from(emailNotificationRecipients)
    .where(
      and(
        eq(emailNotificationRecipients.formId, formId),
        eq(emailNotificationRecipients.enabled, true),
        isNotNull(emailNotificationRecipients.verifiedAt),
      ),
    );
}

/**
 * Stores a submission and counts it, atomically.
 *
 * Express did these as two statements either side of the notification fan-out,
 * so a failure in between stored the submission without counting it -- the row
 * existed but the owner's usage, and therefore their quota and their charts,
 * did not know about it.
 *
 * D8 puts the outbox rows in this same transaction once that table exists.
 * This is the seam they attach to: the transaction is already here, and adding
 * them is one more insert inside it rather than a restructure of the route.
 */
export async function recordSubmission(input: {
  formId: string;
  userId: string;
  payload: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  period: string;
}) {
  return db.transaction(async (tx) => {
    const [submission] = await tx
      .insert(submissions)
      .values({
        formId: input.formId,
        payload: input.payload,
        ip: input.ip,
        userAgent: input.userAgent,
      })
      .returning();

    await tx
      .insert(usage)
      .values({
        userId: input.userId,
        formId: input.formId,
        period: input.period,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [usage.userId, usage.formId, usage.period],
        set: { count: sql`${usage.count} + 1` },
      });

    return submission;
  });
}
