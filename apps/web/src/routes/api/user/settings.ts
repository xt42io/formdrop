import { createFileRoute } from "@tanstack/react-router";
import { quotaFor } from "@formdrop/core";
import {
  countSubmissionsForUser,
  findSubscription,
  hasPasswordCredential,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/user/settings")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;

          // Independent reads, so they go in parallel rather than in sequence.
          const [hasPassword, totalSubmissions, subscription] =
            await Promise.all([
              hasPasswordCredential(userId),
              countSubmissionsForUser(userId),
              findSubscription(userId),
            ]);

          // Plan limits live in packages/core so the dashboard, the API and
          // any future enforcement all read the same numbers.
          const quota = quotaFor(subscription?.status, totalSubmissions);

          return Response.json({
            hasPassword,
            usage: {
              used: quota.used,
              limit: quota.limit,
            },
            subscription,
          });
        } catch (error: any) {
          console.error(error);
          return Response.json(
            { error: "Failed to fetch user settings" },
            { status: 500 },
          );
        }
      },
    },
  },
});
