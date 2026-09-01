import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { user, forms, submissions } from "@formdrop/db/schema";
import { count, sql, desc, gte, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/stats")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
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

          // Get total counts
          const [totalUsers] = await db.select({ count: count() }).from(user);
          const [totalForms] = await db.select({ count: count() }).from(forms);
          const [totalSubmissions] = await db
            .select({ count: count() })
            .from(submissions)
            .where(isNull(submissions.deletedAt));

          // Get users over time (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const usersOverTime = await db
            .select({
              date: sql<string>`DATE(${user.createdAt})`,
              count: count(),
            })
            .from(user)
            .where(gte(user.createdAt, thirtyDaysAgo))
            .groupBy(sql`DATE(${user.createdAt})`)
            .orderBy(sql`DATE(${user.createdAt})`);

          // Get submissions over time (last 30 days)
          const submissionsOverTime = await db
            .select({
              date: sql<string>`DATE(${submissions.createdAt})`,
              count: count(),
            })
            .from(submissions)
            .where(
              sql`${submissions.createdAt} >= ${thirtyDaysAgo} AND ${submissions.deletedAt} IS NULL`,
            )
            .groupBy(sql`DATE(${submissions.createdAt})`)
            .orderBy(sql`DATE(${submissions.createdAt})`);

          // Get top forms by submission count
          const topForms = await db
            .select({
              formId: submissions.formId,
              formName: forms.name,
              count: count(),
            })
            .from(submissions)
            .innerJoin(forms, sql`${submissions.formId} = ${forms.id}`)
            .where(isNull(submissions.deletedAt))
            .groupBy(submissions.formId, forms.name)
            .orderBy(desc(count()))
            .limit(5);

          return new Response(
            JSON.stringify({
              totals: {
                users: totalUsers.count,
                forms: totalForms.count,
                submissions: totalSubmissions.count,
              },
              charts: {
                usersOverTime,
                submissionsOverTime,
                topForms,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Error fetching admin stats:", error);
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
