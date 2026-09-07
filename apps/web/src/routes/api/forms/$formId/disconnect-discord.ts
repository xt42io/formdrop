import { createFileRoute } from "@tanstack/react-router";
import { disconnectDiscord, findOwnedForm } from "@formdrop/core/data";
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

          const { formId } = params;

          // Verify form belongs to user
          const form = await findOwnedForm(formId, session.user.id);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          // Clear Discord integration
          await disconnectDiscord(formId);

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
