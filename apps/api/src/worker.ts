import {
  claimDueDeliveries,
  findDeliveryContext,
  markAttemptFailed,
  markDelivered,
} from "@formdrop/core/data";
import { isExhausted } from "@formdrop/core";
import { captureServer } from "@formdrop/analytics/server";
import { deliver } from "./elysia/notify";

/**
 * The outbox worker (PRD W2, decision D8).
 *
 * "A worker drains the table with retry and exponential backoff, and rows that
 * exhaust their retries stay visible as failures rather than disappearing."
 *
 * No queue infrastructure, which is the whole point of D8: a table, a timer,
 * and `FOR UPDATE SKIP LOCKED` so more than one of these can run without two
 * of them sending the same notification.
 *
 * It runs in-process alongside the API by default. That is genuinely enough at
 * this size and it means there is nothing extra to deploy, but it is exported
 * so it can be started on its own the day sending needs its own box.
 */

/** Rows per tick. Small enough that one slow provider cannot stall a tick. */
const BATCH_SIZE = 20;

/** How often to look for due rows when the last tick found none. */
const IDLE_INTERVAL_MS = 5_000;

function log(event: string, fields: Record<string, unknown>) {
  console.log(JSON.stringify({ level: "info", event, ...fields }));
}

function logError(event: string, fields: Record<string, unknown>) {
  console.error(JSON.stringify({ level: "error", event, ...fields }));
}

/**
 * Drains one batch. Returns how many rows were claimed, so the caller can tell
 * a busy tick from an idle one.
 *
 * Rows are delivered in parallel: they are independent destinations, and doing
 * them in series would let one provider's timeout delay nineteen unrelated
 * notifications.
 */
export async function drainOnce(batchSize = BATCH_SIZE): Promise<number> {
  const claimed = await claimDueDeliveries(batchSize);
  if (claimed.length === 0) return 0;

  await Promise.all(
    claimed.map(async (row) => {
      // Hoisted so the catch can attribute a failure to the right person.
      // The context load is itself one of the things that can fail, so this
      // stays null when the form or submission is gone -- and there is then
      // nobody to attribute the event to.
      let ownerId: string | null = null;

      try {
        const context = await findDeliveryContext(row.submissionId, row.formId);

        if (!context) {
          // The submission or form was deleted between queueing and delivery.
          // Nothing to send and nothing to fix, so this is not retried.
          throw new Error("submission or form no longer exists");
        }

        ownerId = context.form.userId;

        await deliver(row, {
          formName: context.form.name,
          userId: context.form.userId,
          payload: context.submission.payload as Record<string, unknown>,
          slackChannelName: context.form.slackChannelName,
          discordChannelName: context.form.discordChannelName,
          googleSheetsSheetId: context.form.googleSheetsSheetId,
          googleSheetsAccessToken: context.form.googleSheetsAccessToken,
          googleSheetsRefreshToken: context.form.googleSheetsRefreshToken,
          googleSheetsTokenExpiry: context.form.googleSheetsTokenExpiry,
        });

        await markDelivered(row.id);

        // W6: notification_sent, with the channel. This is what the
        // failure-rate-by-channel dashboard the PRD asks for is built from,
        // and it can only be observed here -- delivery happens long after
        // the request that queued it.
        captureServer(context.form.userId, "notification_sent", {
          channel: row.channel,
        });

        log("outbox_delivered", {
          outboxId: row.id,
          channel: row.channel,
          formId: row.formId,
          attempts: row.attempts,
        });
      } catch (error) {
        // Recorded rather than thrown on: one row failing must not abandon the
        // other nineteen in this batch.
        await markAttemptFailed(row.id, row.attempts, error);

        /*
         * Only once the row is out of attempts, not on every retry.
         *
         * A provider having a bad thirty seconds produces several failed
         * attempts and then a success; counting each one would report a
         * failure rate that is mostly noise. What the dashboard needs to
         * show is deliveries that never arrived.
         *
         * Attributed by form id lookup rather than the context, which may be
         * what failed to load.
         */
        if (isExhausted(row.attempts) && ownerId) {
          captureServer(ownerId, "notification_failed", {
            channel: row.channel,
          });
        }

        logError("outbox_attempt_failed", {
          outboxId: row.id,
          channel: row.channel,
          formId: row.formId,
          attempts: row.attempts,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }),
  );

  return claimed.length;
}

/**
 * Runs until stopped.
 *
 * A full batch means there is probably more waiting, so the next tick is
 * immediate; an empty one waits. This keeps a backlog draining quickly without
 * polling an idle table several times a second.
 *
 * Ticks never overlap -- the loop awaits each drain -- so a slow provider
 * delays the next tick rather than stacking batches on top of each other.
 */
export function startOutboxWorker({
  batchSize = BATCH_SIZE,
  idleIntervalMs = IDLE_INTERVAL_MS,
}: { batchSize?: number; idleIntervalMs?: number } = {}) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = async () => {
    if (stopped) return;

    let drained = 0;
    try {
      drained = await drainOnce(batchSize);
    } catch (error) {
      // Reaching here means the claim query itself failed -- the database is
      // unreachable, say. Backing off and trying again is right; exiting would
      // take the API down with it.
      logError("outbox_tick_failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (stopped) return;
    timer = setTimeout(
      () => void tick(),
      drained === batchSize ? 0 : idleIntervalMs,
    );
    // Node keeps the process alive for a pending timer; the worker should not
    // be the reason a container refuses to exit.
    timer.unref?.();
  };

  void tick();
  log("outbox_worker_started", { batchSize, idleIntervalMs });

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    log("outbox_worker_stopped", {});
  };
}
