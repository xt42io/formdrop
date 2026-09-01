import { recordNotificationUsage } from "./recordNotificationUsage";

export async function sendSlackNotification({
  webhookUrl,
  formName,
  data,
  submissionId,
  userId,
  formId,
  period,
  channelName,
}: {
  webhookUrl: string;
  formName: string;
  data: Record<string, any>;
  submissionId: string;
  userId: string;
  formId: string;
  period: string;
  channelName?: string | null;
}) {
  const fields = Object.entries(data).map(([key, value]) => ({
    type: "mrkdwn",
    text: `*${key}:*\n${typeof value === "object" ? JSON.stringify(value, null, 2) : value}`,
  }));

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `✉️ New submission for ${formName}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: fields.slice(0, 10), // Slack limits to 10 fields per section
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Submission ID: \`${submissionId}\` | ${new Date().toLocaleString()}`,
        },
      ],
    },
  ];

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ blocks }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }

  // Record notification usage
  await recordNotificationUsage({
    userId,
    formId,
    submissionId,
    period,
    type: "slack",
    target: channelName || "Unknown channel",
  });

  return response;
}

export async function sendDiscordNotification({
  webhookUrl,
  formName,
  data,
  submissionId,
  userId,
  formId,
  period,
  channelName,
}: {
  webhookUrl: string;
  formName: string;
  data: Record<string, any>;
  submissionId: string;
  userId: string;
  formId: string;
  period: string;
  channelName?: string | null;
}) {
  const fields = Object.entries(data)
    .slice(0, 25) // Discord limits to 25 fields
    .map(([key, value]) => ({
      name: key,
      value:
        typeof value === "object"
          ? `\`\`\`json\n${JSON.stringify(value, null, 2)}\`\`\``
          : String(value),
      inline: false,
    }));

  const embed = {
    title: `✉️ New submission for ${formName}`,
    color: 0x6f63e4, // Accent color
    fields,
    footer: {
      text: `Submission ID: ${submissionId}`,
    },
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.statusText}`);
  }

  // Record notification usage
  await recordNotificationUsage({
    userId,
    formId,
    submissionId,
    period,
    type: "discord",
    target: channelName || "Unknown channel",
  });

  return response;
}
