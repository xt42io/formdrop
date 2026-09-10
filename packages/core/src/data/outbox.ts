import { db } from "@formdrop/db";
import { forms, notificationOutbox, submissions } from "@formdrop/db/schema";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { isExhausted, nextAttemptDelayMs } from "../outbox.ts";

/**
 * The worker's side of the outbox (PRD W2, D8).
 *
 * Everything a delivery needs beyond the row itself -- the payload, the form's
 * name, an OAuth token -- is read here rather than snapshotted when the row
 * was written. A retry an hour later then uses the token the form has now, not
 * the one it had at collect time.
 */

export interface ClaimedDelivery {
  id: string;
  submissionId: string;
  formId: string;
  channel: "email" | "slack" | "discord" | "google_sheets" | "webhook";
  target: string;
  attempts: number;
}

/**
 * Takes ownership of up to `limit` due rows and returns them.
 *
 * Claiming and attempting are one statement, on purpose. `FOR UPDATE SKIP
 * LOCKED` means two workers -- or one worker and its own slow previous tick --
 * cannot pick up the same row, which would send the same notification twice.
 *
 * The attempt is counted and the next attempt pushed forward *here*, before
 * any sending happens, rather than when the send fails. If the process dies
 * mid-request the row is already scheduled into the future, so it is retried
 * once later instead of being picked up again immediately by the next tick,
 * forever.
 */
export async function claimDueDeliveries(
  limit: number,
): Promise<ClaimedDelivery[]> {
  const due = db
    .select({ id: notificationOutbox.id })
    .from(notificationOutbox)
    .where(
      and(
        eq(notificationOutbox.status, "pending"),
        lte(notificationOutbox.nextAttemptAt, new Date()),
      ),
    )
    .orderBy(asc(notificationOutbox.nextAttemptAt))
    .limit(limit)
    .for("update", { skipLocked: true });

  const claimed = await db
    .update(notificationOutbox)
    .set({
      attempts: sql`${notificationOutbox.attempts} + 1`,
      // Pushed out by the backoff for the attempt about to happen, so a crash
      // leaves the row scheduled rather than hot.
      nextAttemptAt: sql`now() + make_interval(secs => ${
        nextAttemptDelayMs(1) / 1000
      })`,
    })
    .where(sql`${notificationOutbox.id} in (${due})`)
    .returning({
      id: notificationOutbox.id,
      submissionId: notificationOutbox.submissionId,
      formId: notificationOutbox.formId,
      channel: notificationOutbox.channel,
      target: notificationOutbox.target,
      attempts: notificationOutbox.attempts,
    });

  return claimed;
}

/** Everything a send needs, read fresh at delivery time. */
export async function findDeliveryContext(
  submissionId: string,
  formId: string,
) {
  const [row] = await db
    .select({ submission: submissions, form: forms })
    .from(submissions)
    .innerJoin(forms, eq(forms.id, submissions.formId))
    .where(and(eq(submissions.id, submissionId), eq(forms.id, formId)))
    .limit(1);

  return row ?? null;
}

export async function markDelivered(id: string) {
  await db
    .update(notificationOutbox)
    .set({ status: "delivered", deliveredAt: new Date(), lastError: null })
    .where(eq(notificationOutbox.id, id));
}

/**
 * Records a failed attempt.
 *
 * A row that has used its attempts becomes `failed` and stops being picked up,
 * but stays in the table with the error that stopped it. The PRD is explicit
 * about that: rows that exhaust their retries "stay visible as failures rather
 * than disappearing", which is the difference between an owner being able to
 * find out a notification never arrived and simply never hearing about it.
 *
 * Below the limit the row is left pending; claimDueDeliveries has already
 * scheduled when it comes round again.
 */
export async function markAttemptFailed(
  id: string,
  attempts: number,
  error: unknown,
) {
  const message = error instanceof Error ? error.message : String(error);

  await db
    .update(notificationOutbox)
    .set({
      status: isExhausted(attempts) ? "failed" : "pending",
      lastError: message.slice(0, 1000),
      nextAttemptAt: sql`now() + make_interval(secs => ${
        nextAttemptDelayMs(attempts) / 1000
      })`,
    })
    .where(eq(notificationOutbox.id, id));
}
