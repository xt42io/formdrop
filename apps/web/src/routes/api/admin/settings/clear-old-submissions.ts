import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { submissions } from "@formdrop/db/schema";
import { lt } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute(
  "/api/admin/settings/clear-old-submissions",
)({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Verify admin authentication
          const session = await auth.api.getSession({
            headers: request.headers,
          });
          if (!session?.user || session.user.role !== "admin") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Delete submissions older than 90 days
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

          const result = await db
            .delete(submissions)
            .where(lt(submissions.createdAt, ninetyDaysAgo))
            .returning({ id: submissions.id });

          return new Response(JSON.stringify({ deletedCount: result.length }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error clearing old submissions:", error);
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
