import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/integrations/discord/callback")({
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
              `${process.env.APP_URL}/app/forms/${state}/notifications?error=discord_denied`,
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

          // Exchange code for access token and webhook
          const tokenResponse = await fetch(
            "https://discord.com/api/oauth2/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID!,
                client_secret: process.env.DISCORD_CLIENT_SECRET!,
                grant_type: "authorization_code",
                code,
                redirect_uri: `${process.env.APP_URL}/api/integrations/discord/callback`,
              }),
            },
          );

          const tokenData = await tokenResponse.json();

          if (!tokenResponse.ok) {
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${formId}/notifications?error=discord_failed`,
              302,
            );
          }

          // Extract webhook information
          const webhook = tokenData.webhook;

          if (!webhook || !webhook.url) {
            return Response.redirect(
              `${process.env.APP_URL}/app/forms/${formId}/notifications?error=discord_no_webhook`,
              302,
            );
          }

          const webhookUrl = webhook.url;
          const channelId = webhook.channel_id;
          const guildId = webhook.guild_id;

          // Fetch guild information to get server name
          let guildName = "Discord Server";
          let channelName = webhook.name || "webhook-channel";

          try {
            const guildResponse = await fetch(
              `https://discord.com/api/v10/guilds/${guildId}`,
              {
                headers: {
                  Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                },
              },
            );

            if (guildResponse.ok) {
              const guildData = await guildResponse.json();
              guildName = guildData.name;
            }

            // Try to get channel name
            const channelResponse = await fetch(
              `https://discord.com/api/v10/channels/${channelId}`,
              {
                headers: {
                  Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                },
              },
            );

            if (channelResponse.ok) {
              const channelData = await channelResponse.json();
              channelName = channelData.name;
            }
          } catch (e) {
            // Fallback to webhook name if we can't fetch guild/channel info
            console.error("Failed to fetch Discord guild/channel info:", e);
          }

          // Update form with Discord information
          await db
            .update(forms)
            .set({
              discordWebhookUrl: webhookUrl,
              discordChannelId: channelId,
              discordChannelName: channelName,
              discordGuildName: guildName,
              discordNotificationsEnabled: true,
            })
            .where(eq(forms.id, formId));

          // Redirect back to notifications page
          return Response.redirect(
            `${process.env.APP_URL}/app/forms/${formId}/notifications?success=discord_connected`,
            302,
          );
        } catch (error: any) {
          console.error("Discord OAuth error:", error);
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
