import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { quotaFor } from "@formdrop/core";
import { account, subscriptions, forms, submissions } from "@formdrop/db/schema";
import { eq, and, isNotNull, count } from "drizzle-orm";
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

          // Check if user has a password set
          const [passwordAccount] = await db
            .select()
            .from(account)
            .where(and(eq(account.userId, userId), isNotNull(account.password)))
            .limit(1);

          const hasPassword = !!passwordAccount;

          // Get total submissions count
          const [result] = await db
            .select({ count: count() })
            .from(submissions)
            .innerJoin(forms, eq(submissions.formId, forms.id))
            .where(eq(forms.userId, userId));

          const totalSubmissions = result?.count || 0;

          // Get subscription for limits
          const [subscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1);

          // Plan limits live in packages/core so the dashboard, the API and
          // any future enforcement all read the same numbers.
          const quota = quotaFor(subscription?.status, totalSubmissions);

          return Response.json({
            hasPassword,
            usage: {
              used: quota.used,
              limit: quota.limit,
            },
            subscription: subscription || null,
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
