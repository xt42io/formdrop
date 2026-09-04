/**
 * Which channels a submission should be delivered to.
 *
 * This is only the routing decision — deciding *who* gets told. Actually
 * sending is the caller's job, because senders need credentials and network
 * access and this package stays pure so it can be unit tested without either.
 *
 * The shapes are structural rather than Drizzle row types, so a test can build
 * a form without a database.
 */
export interface NotificationForm {
  emailNotificationsEnabled?: boolean | null;
  slackNotificationsEnabled?: boolean | null;
  slackWebhookUrl?: string | null;
  slackChannelName?: string | null;
  discordNotificationsEnabled?: boolean | null;
  discordWebhookUrl?: string | null;
  discordChannelName?: string | null;
  googleSheetsEnabled?: boolean | null;
  googleSheetsSpreadsheetId?: string | null;
  googleSheetsAccessToken?: string | null;
}

export interface NotificationTargets {
  /** Deduplicated, owner first. Empty when email notifications are off. */
  emails: string[];
  slack: { webhookUrl: string; channelName: string | null } | null;
  discord: { webhookUrl: string; channelName: string | null } | null;
  googleSheets: { spreadsheetId: string; accessToken: string } | null;
}

/**
 * A channel is only a target when it is both enabled *and* configured. Slack
 * and Discord need a webhook URL, Sheets needs a spreadsheet and a token —
 * enabling a channel without finishing its setup must not produce a send.
 */
export function resolveNotificationTargets(
  form: NotificationForm,
  ownerEmail: string,
  verifiedRecipients: Array<{ email: string }> = [],
): NotificationTargets {
  const emails = form.emailNotificationsEnabled
    ? // The owner always receives it when email is on, and is listed first so
      // dedup keeps the owner entry rather than a duplicate recipient row.
      [...new Set([ownerEmail, ...verifiedRecipients.map((r) => r.email)])]
    : [];

  return {
    emails,
    slack:
      form.slackNotificationsEnabled && form.slackWebhookUrl
        ? {
            webhookUrl: form.slackWebhookUrl,
            channelName: form.slackChannelName ?? null,
          }
        : null,
    discord:
      form.discordNotificationsEnabled && form.discordWebhookUrl
        ? {
            webhookUrl: form.discordWebhookUrl,
            channelName: form.discordChannelName ?? null,
          }
        : null,
    googleSheets:
      form.googleSheetsEnabled &&
      form.googleSheetsSpreadsheetId &&
      form.googleSheetsAccessToken
        ? {
            spreadsheetId: form.googleSheetsSpreadsheetId,
            accessToken: form.googleSheetsAccessToken,
          }
        : null,
  };
}
