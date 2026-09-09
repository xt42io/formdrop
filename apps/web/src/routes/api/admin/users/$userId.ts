import { createFileRoute } from "@tanstack/react-router";
import {
  findUserDetail,
  listFormsForUserWithCounts,
  listRecentSubmissionsForUser,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

const GET = async ({
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
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;

    // Get user details
    const userDetail = await findUserDetail(userId);

    if (!userDetail) {
      return json({ error: "User not found" }, { status: 404 });
    }

    // Get user's forms with submission counts
    const userForms = await listFormsForUserWithCounts(userId);

    // Get user's recent submissions (last 20)
    const recentSubmissions = await listRecentSubmissionsForUser(userId, 20);

    return json(
      {
        user: {
          ...userDetail,
          forms: userForms,
          recentSubmissions,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user details:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export type AdminUsersUseridGetResponse = HandlerPayload<typeof GET>;

export const Route = createFileRoute("/api/admin/users/$userId")({
  server: { handlers: { GET } },
});
