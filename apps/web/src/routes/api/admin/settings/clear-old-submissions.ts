import { createFileRoute } from "@tanstack/react-router";
import { deleteSubmissionsOlderThan } from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

const POST = async ({ request }: { request: Request }) => {
  try {
    // Verify admin authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete submissions older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deletedCount = await deleteSubmissionsOlderThan(ninetyDaysAgo);

    return json({ deletedCount }, { status: 200 });
  } catch (error) {
    console.error("Error clearing old submissions:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export type AdminSettingsClearOldSubmissionsPostResponse = HandlerPayload<
  typeof POST
>;

export const Route = createFileRoute(
  "/api/admin/settings/clear-old-submissions",
)({
  server: { handlers: { POST } },
});
