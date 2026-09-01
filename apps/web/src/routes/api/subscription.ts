import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { subscriptions } from "@formdrop/db/schema";
import { eq } from "drizzle-orm";
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

          const userId = session.user.id;

          const [subscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1);

          return Response.json({ subscription: subscription || null });
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
