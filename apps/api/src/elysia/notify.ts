import type { ClaimedDelivery } from "@formdrop/core/data";
import { sendEmailNotification } from "../lib/sendEmailNotification";
import {
  sendDiscordNotification,
  sendSlackNotification,
} from "../lib/sendWebhookNotification";
import { syncGoogleSheets } from "../lib/syncGoogleSheets";

/**
 * Delivers one outbox row (PRD W2, D8).
 *
 * This used to be `dispatchNotifications`: the route called it with every
 * channel at once, it fired four requests without awaiting any of them, and
 * whatever failed was logged and forgotten. There were no retries and the
 * owner was never told.
 *
 * One row, one channel, and it throws. Both matter. Per-channel means a
 * bounced address retries on its own instead of dragging Slack with it, and
 * throwing is how the worker learns to schedule another attempt -- the old
 * version swallowed errors precisely because nothing was listening.
 */
export interface DeliveryContext {
  formName: string;
  userId: string;
  payload: Record<string, unknown>;
  slackChannelName: string | null;
  discordChannelName: string | null;
  googleSheetsSheetId: string | null;
  googleSheetsAccessToken: string | null;
  googleSheetsRefreshToken: string | null;
  googleSheetsTokenExpiry: Date | null;
}

export async function deliver(
  row: ClaimedDelivery,
  context: DeliveryContext,
): Promise<void> {
  const shared = {
    formName: context.formName,
    data: context.payload,
    userId: context.userId,
    formId: row.formId,
    submissionId: row.submissionId,
    // The usage period is only used for reporting inside the senders; the
    // counter itself was incremented in the submission's transaction.
    period: "",
  };

  switch (row.channel) {
    case "email":
      // `target` is the recipient address, which is why email produces a row
      // per recipient rather than one row for all of them.
      await sendEmailNotification({ ...shared, recipientEmail: row.target });
      return;

    case "slack":
      await sendSlackNotification({
        ...shared,
        webhookUrl: row.target,
        channelName: context.slackChannelName,
      });
      return;

    case "discord":
      await sendDiscordNotification({
        ...shared,
        webhookUrl: row.target,
        channelName: context.discordChannelName,
      });
      return;

    case "google_sheets": {
      // Read now rather than snapshotted when the row was written: an access
      // token captured at collect time is very likely expired by the time a
      // retry runs.
      if (!context.googleSheetsAccessToken) {
        throw new Error("Google Sheets is no longer connected for this form");
      }

      await syncGoogleSheets({
        spreadsheetId: row.target,
        sheetId: context.googleSheetsSheetId,
        accessToken: context.googleSheetsAccessToken,
        refreshToken: context.googleSheetsRefreshToken,
        tokenExpiry: context.googleSheetsTokenExpiry,
        submissionData: context.payload,
        submissionId: row.submissionId,
        formId: row.formId,
        userId: context.userId,
        formName: context.formName,
      });
      return;
    }

    case "webhook":
      // In the schema's enum so the column does not need a migration when
      // outbound webhooks land, but nothing writes one yet. Failing loudly
      // beats a row that silently reports success.
      throw new Error("Outbound webhooks are not implemented yet");

    default: {
      // Exhaustiveness: adding a channel to the enum without handling it here
      // becomes a type error rather than a row that never delivers.
      const unreachable: never = row.channel;
      throw new Error(`Unknown outbox channel: ${String(unreachable)}`);
    }
  }
}
