import type { NotificationTargets } from "./notifications.ts";

/**
 * The durable notification queue's rules (PRD W2, decision D8).
 *
 * Today's fan-out is fire-and-forget: `POST /f/:slug` kicks off four sends and
 * returns, failures are logged and dropped, and nobody -- least of all the
 * form's owner -- ever finds out that a submission was collected but never
 * delivered. D8 replaces that with a Postgres table written inside the
 * submission's own transaction and drained by a worker.
 *
 * What lives here is only the arithmetic and the routing: which rows a
 * submission produces, when a failed row may be retried, and when it has run
 * out of attempts. Sending needs credentials and a network, so it stays in
 * apps/api -- keeping this half pure is what lets the retry schedule be tested
 * without a database or a single outbound request.
 */

/** Mirrors the `outbox_channel` enum in the schema. */
export type OutboxChannel =
  | "email"
  | "slack"
  | "discord"
  | "google_sheets"
  | "webhook";

export interface PlannedDelivery {
  channel: OutboxChannel;
  /** The address this row delivers to: an email, a webhook URL, a sheet id. */
  target: string;
}

/**
 * The rows a submission should produce, one per destination.
 *
 * Email fans out to a row per recipient rather than one row for the lot. A
 * single row would mean one bounced address either failing the whole group or
 * being silently skipped on the retry, and there would be no way to see which
 * of five recipients never received it.
 *
 * Only the address is stored. Everything else a send needs -- the payload, the
 * form's name, an OAuth token -- is read when the row is delivered, which
 * matters most for Google Sheets: a token snapshotted at collect time may well
 * have expired by the time a retry runs an hour later.
 */
export function plannedDeliveries(
  targets: NotificationTargets,
): PlannedDelivery[] {
  const planned: PlannedDelivery[] = targets.emails.map((email) => ({
    channel: "email" as const,
    target: email,
  }));

  if (targets.slack) {
    planned.push({ channel: "slack", target: targets.slack.webhookUrl });
  }

  if (targets.discord) {
    planned.push({ channel: "discord", target: targets.discord.webhookUrl });
  }

  if (targets.googleSheets) {
    planned.push({
      channel: "google_sheets",
      target: targets.googleSheets.spreadsheetId,
    });
  }

  return planned;
}

/**
 * How many times a row is tried before it is given up on.
 *
 * Six attempts spread over the backoff below reach roughly half an hour, which
 * covers the ordinary case this exists for: a provider having a bad few
 * minutes. Past that the failure is unlikely to be transient, and a row that
 * retries forever is a row nobody ever looks at.
 */
export const MAX_ATTEMPTS = 6;

/** Retry delays in milliseconds: 30s, 2m, 5m, 15m, 30m. */
const BACKOFF_MS = [30_000, 120_000, 300_000, 900_000, 1_800_000];

/**
 * When a row that has just failed may be tried again.
 *
 * `attempts` is the count *including* the one that just failed, so the first
 * failure waits 30 seconds. Delays are capped at the last step rather than
 * doubling without limit -- an outage lasting hours should be retried every
 * half hour, not once a day.
 */
export function nextAttemptDelayMs(attempts: number): number {
  const index = Math.max(0, attempts - 1);
  return BACKOFF_MS[Math.min(index, BACKOFF_MS.length - 1)];
}

/** Whether a row has run out of attempts and should be marked failed. */
export function isExhausted(attempts: number): boolean {
  return attempts >= MAX_ATTEMPTS;
}
