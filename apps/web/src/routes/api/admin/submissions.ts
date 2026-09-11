import { createFileRoute } from "@tanstack/react-router";
import { listRecentSubmissionsAcrossAllForms } from "@formdrop/core/data";
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

    const allSubmissions = await listRecentSubmissionsAcrossAllForms(100);

    return json({ submissions: allSubmissions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin submissions:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export type AdminSubmissionsGetResponse = HandlerPayload<typeof GET>;

export const Route = createFileRoute("/api/admin/submissions")({
  server: { handlers: { GET } },
});
