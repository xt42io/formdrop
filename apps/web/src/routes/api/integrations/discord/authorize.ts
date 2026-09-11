import { createFileRoute } from "@tanstack/react-router";
import { findOwnedForm } from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { isUserPro } from "@/lib/subscription-check";

export const Route = createFileRoute("/api/integrations/discord/authorize")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const url = new URL(request.url);
          const formId = url.searchParams.get("formId");

          if (!formId) {
            return Response.json(
              { error: "formId is required" },
              { status: 400 },
            );
          }

          const isPro = await isUserPro(session.user.id);
          if (!isPro) {
            return Response.redirect(
              `${url.origin}/app/forms/${formId}/notifications?error=requires_pro`,
            );
          }

          const form = await findOwnedForm(formId, session.user.id);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          const clientId = process.env.DISCORD_CLIENT_ID;
          const redirectUri = `${process.env.APP_URL}/api/integrations/discord/callback`;

          if (!clientId) {
            return Response.json(
              { error: "Discord integration not configured" },
              { status: 500 },
            );
          }

          const discordAuthUrl = new URL(
            "https://discord.com/api/oauth2/authorize",
          );
          discordAuthUrl.searchParams.set("client_id", clientId);
          discordAuthUrl.searchParams.set("response_type", "code");
          discordAuthUrl.searchParams.set("scope", "webhook.incoming");
          discordAuthUrl.searchParams.set("redirect_uri", redirectUri);
          discordAuthUrl.searchParams.set("state", formId); // Pass formId in state

          return Response.redirect(discordAuthUrl.toString(), 302);
        } catch (error: any) {
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
