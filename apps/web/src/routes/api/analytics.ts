import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms, usage } from "@formdrop/db/schema";
import { eq, and, sql, gte, isNull, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import moment from "moment";

export const Route = createFileRoute("/api/analytics")({
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

          // Get total forms
          const [formsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(forms)
            .where(and(eq(forms.userId, userId), isNull(forms.deletedAt)));

          // Get total submissions across all user forms
          const [submissionsResult] = await db
            .select({ count: sql<number>`sum(${usage.count})` })
            .from(usage)
            .innerJoin(forms, eq(usage.formId, forms.id))
            .where(and(eq(forms.userId, userId), isNull(forms.deletedAt)));

          // Get submissions for this month
          const startOfMonthStr = moment()
            .startOf("month")
            .format("YYYY-MM-DD");
          const [thisMonthResult] = await db
            .select({ count: sql<number>`sum(${usage.count})` })
            .from(usage)
            .innerJoin(forms, eq(usage.formId, forms.id))
            .where(
              and(
                eq(forms.userId, userId),
                isNull(forms.deletedAt),
                gte(usage.period, startOfMonthStr),
              ),
            );

          // Get submissions for the last 30 days for chart
          const thirtyDaysAgoStr = moment()
            .subtract(29, "days")
            .format("YYYY-MM-DD");

          const dailyStats = await db
            .select({
              date: usage.period,
              count: sql<number>`sum(${usage.count})`,
            })
            .from(usage)
            .innerJoin(forms, eq(usage.formId, forms.id))
            .where(
              and(
                eq(forms.userId, userId),
                isNull(forms.deletedAt),
                gte(usage.period, thirtyDaysAgoStr),
              ),
            )
            .groupBy(usage.period)
            .orderBy(usage.period);

          // Fill in missing days
          const chartData = Array.from({ length: 30 }, (_, i) => {
            const date = moment().subtract(29 - i, "days");
            const dateStr = date.format("YYYY-MM-DD");
            const dayStat = dailyStats.find((s) => s.date === dateStr);
            return {
              date: date.format("MMM DD"),
              submissions: Number(dayStat?.count || 0),
            };
          });

          // Get top performing forms
          const topForms = await db
            .select({
              id: forms.id,
              name: forms.name,
              submissionCount: sql<number>`sum(${usage.count})`,
            })
            .from(forms)
            .leftJoin(usage, eq(forms.id, usage.formId))
            .where(and(eq(forms.userId, userId), isNull(forms.deletedAt)))
            .groupBy(forms.id, forms.name)
            .orderBy(desc(sql`sum(${usage.count})`))
            .limit(5);

          return Response.json({
            stats: {
              totalForms: Number(formsResult?.count || 0),
              totalSubmissions: Number(submissionsResult?.count || 0),
              submissionsThisMonth: Number(thisMonthResult?.count || 0),
            },
            chartData,
            topForms: topForms.map((f) => ({
              ...f,
              submissionCount: Number(f.submissionCount),
            })),
          });
        } catch (error: any) {
          return Response.json(
            {
              error: "Internal server error",
              details: error.message,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
