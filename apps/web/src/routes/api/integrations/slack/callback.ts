import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/integrations/slack/callback")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state"); // formId
          const error = url.searchParams.get("error");

          if (error) {
            // User denied access
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${state}/notifications?error=slack_denied`,
              302,
            );
          }

          if (!code || !state) {
            return Response.json(
              { error: "Missing code or state" },
              { status: 400 },
            );
          }

          const formId = state;

          // Exchange code for access token
          const tokenResponse = await fetch(
            "https://slack.com/api/oauth.v2.access",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                client_id: process.env.SLACK_CLIENT_ID!,
                client_secret: process.env.SLACK_CLIENT_SECRET!,
                code,
                redirect_uri: `${process.env.APP_URL}/api/integrations/slack/callback`,
              }),
            },
          );

          const tokenData = await tokenResponse.json();

          if (!tokenData.ok) {
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${formId}/notifications?error=slack_failed`,
              302,
            );
          }

          // Extract webhook information
          const webhookUrl = tokenData.incoming_webhook?.url;
          const channelId = tokenData.incoming_webhook?.channel_id;
          const channelName = tokenData.incoming_webhook?.channel;
          const teamName = tokenData.team?.name;

          if (!webhookUrl) {
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${formId}/notifications?error=slack_no_webhook`,
              302,
            );
          }

          // Update form with Slack information
          await db
            .update(forms)
            .set({
              slackWebhookUrl: webhookUrl,
              slackChannelId: channelId,
              slackChannelName: channelName,
              slackTeamName: teamName,
              slackNotificationsEnabled: true,
            })
            .where(eq(forms.id, formId));

          // Redirect back to notifications page
          return Response.redirect(
            `${process.env.APP_URL}/app/forms/${formId}/notifications?success=slack_connected`,
            302,
          );
        } catch (error: any) {
          console.error("Slack OAuth error:", error);
          return Response.json(
            {
              error: "Internal server error",
              details: error.message,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
