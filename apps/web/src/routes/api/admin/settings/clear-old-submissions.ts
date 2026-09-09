import { createFileRoute } from "@tanstack/react-router";
import {
  countSubmissionsOlderThan,
  deleteSubmissionsOlderThan,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

/**
 * The retention tool.
 *
 * GET reports how many rows the delete would take; POST takes them. Two
 * methods on one route rather than a dry-run flag, so a caller cannot ask for
 * a preview and get a deletion by passing the wrong argument.
 *
 * The window lives here, once. It was written into the handler and again into
 * the page's copy, which is two places to change and one of them will be
 * missed -- and the number in a confirmation is the one thing on that dialog
 * that has to be right.
 */
const RETENTION_DAYS = 90;

function cutoffDate(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  return cutoff;
}

const GET = async ({ request }: { request: Request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = cutoffDate();

    return json({
      retentionDays: RETENTION_DAYS,
      cutoff: cutoff.toISOString(),
      count: await countSubmissionsOlderThan(cutoff),
    });
  } catch (error) {
    console.error("Error counting old submissions:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

const POST = async ({ request }: { request: Request }) => {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== "admin") {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = cutoffDate();
    const deletedCount = await deleteSubmissionsOlderThan(cutoff);

    // A hard delete on somebody else's data, so it leaves a trace.
    console.log(
      `admin ${session.user.id} deleted ${deletedCount} submissions older than ${cutoff.toISOString()}`,
    );

    // Reports what actually went, not what the count predicted -- rows age
    // past the cutoff between the two calls.
    return json({ deletedCount, retentionDays: RETENTION_DAYS });
  } catch (error) {
    console.error("Error clearing old submissions:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export type AdminSettingsClearOldSubmissionsGetResponse = HandlerPayload<
  typeof GET
>;
export type AdminSettingsClearOldSubmissionsPostResponse = HandlerPayload<
  typeof POST
>;

export const Route = createFileRoute(
  "/api/admin/settings/clear-old-submissions",
)({
  server: { handlers: { GET, POST } },
});
