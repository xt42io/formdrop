import { createFileRoute } from "@tanstack/react-router";
import { listAllFormsWithOwners } from "@formdrop/core/data";
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

    const allForms = await listAllFormsWithOwners();

    return json({ forms: allForms }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin forms:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export type AdminFormsGetResponse = HandlerPayload<typeof GET>;

export const Route = createFileRoute("/api/admin/forms")({
  server: { handlers: { GET } },
});
