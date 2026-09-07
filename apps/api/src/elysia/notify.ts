import type { NotificationTargets } from "@formdrop/core";
import { sendEmailNotification } from "../lib/sendEmailNotification";
import {
  sendDiscordNotification,
  sendSlackNotification,
} from "../lib/sendWebhookNotification";
import { syncGoogleSheets } from "../lib/syncGoogleSheets";

/**
 * Fans a stored submission out to the channels resolved for its form.
 *
 * Fire-and-forget, matching Express: the response goes back as soon as the
 * submission is stored, and delivery happens afterwards. A channel that fails
 * is logged and dropped -- there is no retry and the owner is never told.
 *
 * That is the behaviour W2 replaces with the D8 outbox, and it is the reason
 * this is a separate function rather than inline in the route: when the outbox
 * table exists, the route writes rows inside its transaction and a worker
 * calls into here, without the route changing shape again.
 *
 * Errors are swallowed per channel on purpose. One channel's outage must not
 * stop the others, and none of them can affect a response that has already
 * been sent.
 */
export interface NotificationContext {
  formId: string;
  formName: string;
  userId: string;
  submissionId: string;
  period: string;
  payload: Record<string, unknown>;
  slackChannelName: string | null;
  discordChannelName: string | null;
  googleSheetsSheetId: string | null;
  googleSheetsRefreshToken: string | null;
  googleSheetsTokenExpiry: Date | null;
}

function report(channel: string, context: NotificationContext, error: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      event: "notification_failed",
      channel,
      formId: context.formId,
      submissionId: context.submissionId,
      message: error instanceof Error ? error.message : String(error),
    }),
  );
}

export function dispatchNotifications(
  targets: NotificationTargets,
  context: NotificationContext,
): void {
  const shared = {
    formName: context.formName,
    data: context.payload,
    userId: context.userId,
    formId: context.formId,
    submissionId: context.submissionId,
    period: context.period,
  };

  for (const email of targets.emails) {
    void sendEmailNotification({ ...shared, recipientEmail: email }).catch(
      (error: unknown) => report("email", context, error),
    );
  }

  if (targets.slack) {
    void sendSlackNotification({
      ...shared,
      webhookUrl: targets.slack.webhookUrl,
      channelName: context.slackChannelName,
    }).catch((error: unknown) => report("slack", context, error));
  }

  if (targets.discord) {
    void sendDiscordNotification({
      ...shared,
      webhookUrl: targets.discord.webhookUrl,
      channelName: context.discordChannelName,
    }).catch((error: unknown) => report("discord", context, error));
  }

  if (targets.googleSheets) {
    void syncGoogleSheets({
      spreadsheetId: targets.googleSheets.spreadsheetId,
      sheetId: context.googleSheetsSheetId,
      accessToken: targets.googleSheets.accessToken,
      refreshToken: context.googleSheetsRefreshToken,
      tokenExpiry: context.googleSheetsTokenExpiry,
      submissionData: context.payload,
      submissionId: context.submissionId,
      formId: context.formId,
      userId: context.userId,
      formName: context.formName,
    }).catch((error: unknown) => report("google_sheets", context, error));
  }
}
