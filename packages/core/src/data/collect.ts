import { db } from "@formdrop/db";
import {
  emailNotificationRecipients,
  forms,
  notificationOutbox,
  submissions,
  usage,
  user,
} from "@formdrop/db/schema";
import type { PlannedDelivery } from "../outbox.ts";
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
 * The outbox rows go in the same transaction (D8). That is the whole point of
 * the design: a submission and the intent to deliver it are committed together
 * or not at all, so there is no window where a row is stored with nothing
 * queued to tell anyone about it -- which is exactly what the fire-and-forget
 * fan-out this replaces could do on any failure.
 */
export async function recordSubmission(input: {
  formId: string;
  userId: string;
  payload: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  period: string;
  /** One row per destination, from plannedDeliveries(). */
  deliveries: PlannedDelivery[];
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

    // No rows when the form has no channel configured. Inserting an empty
    // array is an error in Drizzle, and a form nobody asked to be notified
    // about should not leave anything behind for the worker to scan.
    if (input.deliveries.length > 0) {
      await tx.insert(notificationOutbox).values(
        input.deliveries.map((delivery) => ({
          submissionId: submission.id,
          formId: input.formId,
          channel: delivery.channel,
          target: delivery.target,
        })),
      );
    }

    return submission;
  });
}
