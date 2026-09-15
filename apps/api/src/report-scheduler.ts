import {
  changePercent,
  lastCompletedPeriod,
  previousPeriod,
  type ReportFrequency,
} from "@formdrop/core";
import {
  REPORT_TEMPLATE,
  findAccountsDueForReport,
  reportStatsForUser,
  submissionsInRange,
} from "@formdrop/core/data";
import { ReportEmail, sendEmail } from "@formdrop/email";

/**
 * The weekly and monthly summary (PRD W7).
 *
 * Shaped like the outbox worker: a timer, a batch, no queue infrastructure.
 * Unlike the outbox there is no due-row table, because whether an account is
 * owed a report is a function of the calendar and what `email_deliveries`
 * already contains.
 */

/** Reports are due at a period boundary, not a moment, so this is loose. */
const TICK_MS = 15 * 60_000;

/** Accounts per tick, so one slow provider cannot stall the rest of a run. */
const BATCH_SIZE = 25;

/**
 * Attempts allowed within one period. A transient failure deserves another
 * go; an address that will never accept mail should not be retried forever.
 */
const ATTEMPT_CAP = 3;

/** Forms listed in the email before it turns into a wall of rows. */
const TOP_FORMS = 5;

const FREQUENCIES: ReportFrequency[] = ["weekly", "monthly"];

function log(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: "info", event, ...fields }));
}

function logError(event: string, fields: Record<string, unknown>) {
  console.error(JSON.stringify({ level: "error", event, ...fields }));
}

/** Sends one account its summary. */
export async function sendReport(input: {
  account: { id: string; email: string };
  frequency: ReportFrequency;
  now?: Date;
  appUrl?: string;
}) {
  const period = lastCompletedPeriod(input.frequency, input.now ?? new Date());
  const prior = previousPeriod(input.frequency, period);

  const [current, before] = await Promise.all([
    reportStatsForUser({
      userId: input.account.id,
      start: period.start,
      end: period.end,
      topFormLimit: TOP_FORMS,
    }),
    submissionsInRange({
      userId: input.account.id,
      start: prior.start,
      end: prior.end,
    }),
  ]);

  const appUrl = input.appUrl ?? process.env.APP_URL;

  await sendEmail({
    to: input.account.email,
    subject:
      input.frequency === "weekly"
        ? `Your week on FormDrop — ${period.label}`
        : `Your month on FormDrop — ${period.label}`,
    templateName: REPORT_TEMPLATE,
    userId: input.account.id,
    // One report per account per period whatever happens to the scheduler --
    // belt as well as the braces of the email_deliveries check above.
    idempotencyKey: `report:${input.frequency}:${period.start}:${input.account.id}`,
    template: ReportEmail({
      period: input.frequency === "weekly" ? "week" : "month",
      rangeLabel: period.label,
      submissions: current.submissions,
      changePercent: changePercent(current.submissions, before),
      topForms: current.topForms,
      dashboardUrl: appUrl ? `${appUrl}/app` : "",
    }),
  });

  return { period, submissions: current.submissions };
}

/** One pass over one cadence. Returns how many accounts were sent to. */
export async function runOnce(
  frequency: ReportFrequency,
  now: Date = new Date(),
) {
  const period = lastCompletedPeriod(frequency, now);

  // Asked as "is there a delivery row since the period ended". The end date
  // is a day key, so the boundary is midnight UTC on the day after it.
  const since = new Date(`${period.end}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() + 1);

  const due = await findAccountsDueForReport({
    frequency,
    since,
    attemptCap: ATTEMPT_CAP,
    limit: BATCH_SIZE,
  });

  if (due.length === 0) return 0;

  let sent = 0;
  // Sequential on purpose. These are unrelated accounts, but sending them in
  // parallel is how a scheduler trips a provider's rate limit on the first
  // Monday it has real volume.
  for (const account of due) {
    try {
      const result = await sendReport({ account, frequency, now });
      sent += 1;
      log("report_sent", {
        userId: account.id,
        frequency,
        period: result.period.start,
        submissions: result.submissions,
      });
    } catch (error) {
      // Already a row in email_deliveries; this is for the process output.
      logError("report_failed", {
        userId: account.id,
        frequency,
        period: period.start,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return sent;
}

/**
 * Starts the scheduler. Returns a function that stops it.
 *
 * The first tick runs on start rather than after the first interval, so a
 * deploy that happens to land just after a period boundary does not wait
 * fifteen minutes to notice.
 */
export function startReportScheduler() {
  let running = false;

  const tick = async () => {
    // A tick that overruns must not have a second one begin underneath it.
    if (running) return;
    running = true;

    try {
      for (const frequency of FREQUENCIES) {
        const sent = await runOnce(frequency);
        if (sent > 0) log("report_batch", { frequency, sent });
      }
    } catch (error) {
      logError("report_tick_failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      running = false;
    }
  };

  void tick();
  const timer = setInterval(tick, TICK_MS);

  // The scheduler must not be the reason a process refuses to exit.
  timer.unref?.();

  log("report_scheduler_started", { tickMs: TICK_MS, batchSize: BATCH_SIZE });

  return () => clearInterval(timer);
}
