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
import { json, type HandlerPayload } from "@/lib/api/respond";

const GET = async ({ request }: { request: Request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalUsers = await countAllUsers();
    const totalForms = await countAllForms();
    const totalSubmissions = await countAllSubmissions();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersOverTime = await usersCreatedSince(thirtyDaysAgo);

    const submissionsOverTime = await submissionsCreatedSince(thirtyDaysAgo);

    const topForms = await topFormsAcrossAllUsers(5);

    return json(
      {
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
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export type AdminStatsGetResponse = HandlerPayload<typeof GET>;

export const Route = createFileRoute("/api/admin/stats")({
  server: { handlers: { GET } },
});
