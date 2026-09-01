import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms } from "@formdrop/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/forms/$formId/disconnect-discord")({
  server: {
    handlers: {
      DELETE: async ({
        request,
        params,
      }: {
        request: Request;
        params: { formId: string };
      }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId } = params;

          // Verify form belongs to user
          const [form] = await db
            .select()
            .from(forms)
            .where(
              and(
                eq(forms.id, formId),
                eq(forms.userId, userId),
                isNull(forms.deletedAt),
              ),
            )
            .limit(1);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          // Clear Discord integration
          await db
            .update(forms)
            .set({
              discordWebhookUrl: null,
              discordChannelId: null,
              discordChannelName: null,
              discordGuildName: null,
              discordNotificationsEnabled: false,
            })
            .where(eq(forms.id, formId));

          return Response.json({ success: true });
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
