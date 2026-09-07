import { createFileRoute } from "@tanstack/react-router";
import { findSubscription } from "@formdrop/core/data";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/subscription")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const subscription = await findSubscription(session.user.id);

          return Response.json({ subscription });
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