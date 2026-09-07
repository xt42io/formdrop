import { createFileRoute } from "@tanstack/react-router";
import { listRecentSubmissionsAcrossAllForms } from "@formdrop/core/data";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/submissions")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
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

          // Get recent submissions with form names
          const allSubmissions = await listRecentSubmissionsAcrossAllForms(100);

          return new Response(JSON.stringify({ submissions: allSubmissions }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error fetching admin submissions:", error);
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
