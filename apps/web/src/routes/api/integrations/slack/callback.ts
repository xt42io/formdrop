import { createFileRoute } from "@tanstack/react-router";
import { findFormById, updateFormById } from "@formdrop/core/data";

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

          await updateFormById(formId, {
            slackWebhookUrl: webhookUrl,
            slackChannelId: channelId,
            slackChannelName: channelName,
            slackTeamName: teamName,
            slackNotificationsEnabled: true,
          });

          /*
           * The connection happened here, exactly once. Capturing it from the
           * page the redirect lands on would count again on every reload of a
           * URL that still carries ?success=, and would miss the case where
           * the tab is closed before it renders.
           *
           * Lazily imported: posthog-node must not reach the client bundle.
           */
          try {
            const owner = await findFormById(formId);
            if (owner) {
              const { captureServer } = await import("@/lib/server-analytics");
              captureServer(owner.userId, "integration_connected", {
                provider: "slack",
              });
            }
          } catch (analyticsError) {
            console.error(
              "integration_connected capture failed",
              analyticsError,
            );
          }

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
