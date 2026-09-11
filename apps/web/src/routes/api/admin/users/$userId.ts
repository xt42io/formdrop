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
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = params;

    const userDetail = await findUserDetail(userId);

    if (!userDetail) {
      return json({ error: "User not found" }, { status: 404 });
    }

    const userForms = await listFormsForUserWithCounts(userId);

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
