import { createFileRoute } from "@tanstack/react-router";
import {
  findUserDetail,
  listFormsForUserWithCounts,
  listRecentSubmissionsForUser,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/users/$userId")({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { userId: string };
      }) => {
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

          const { userId } = params;

          // Get user details
          const userDetail = await findUserDetail(userId);

          if (!userDetail) {
            return new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Get user's forms with submission counts
          const userForms = await listFormsForUserWithCounts(userId);

          // Get user's recent submissions (last 20)
          const recentSubmissions = await listRecentSubmissionsForUser(
            userId,
            20,
          );

          return new Response(
            JSON.stringify({
              user: {
                ...userDetail,
                forms: userForms,
                recentSubmissions,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Error fetching user details:", error);
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
