import { createFileRoute } from "@tanstack/react-router";
import {
  countAllForms,
  countAllSubmissions,
  countAllUsers,
  submissionsCreatedSince,
  topFormsAcrossAllUsers,
  usersCreatedSince,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/stats")({
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

          // Get total counts
          const totalUsers = await countAllUsers();
          const totalForms = await countAllForms();
          const totalSubmissions = await countAllSubmissions();

          // Get users over time (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const usersOverTime = await usersCreatedSince(thirtyDaysAgo);

          // Get submissions over time (last 30 days)
          const submissionsOverTime =
            await submissionsCreatedSince(thirtyDaysAgo);

          // Get top forms by submission count
          const topForms = await topFormsAcrossAllUsers(5);

          return new Response(
            JSON.stringify({
              totals: {
                users: totalUsers,
                forms: totalForms,
                submissions: totalSubmissions,
              },
              charts: {
                usersOverTime,
                submissionsOverTime,
                topForms,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Error fetching admin stats:", error);
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
