import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms, usage } from "@formdrop/db/schema";
import { eq, and, sql, gte, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import moment from "moment";

export const Route = createFileRoute("/api/forms/$formId/analytics")({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { formId: string };
      }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;
          const { formId } = params;

          // Verify form belongs to user
          const [form] = await db
            .select()
            .from(forms)
            .where(
              and(
                eq(forms.id, formId),
                eq(forms.userId, userId),
                isNull(forms.deletedAt),
              ),
            )
            .limit(1);

          if (!form) {
            return Response.json({ error: "Form not found" }, { status: 404 });
          }

          // Get total submissions
          const [totalResult] = await db
            .select({ count: sql<number>`sum(${usage.count})` })
            .from(usage)
            .where(eq(usage.formId, formId));

          // Get this month's submissions
          const startOfMonthStr = moment()
            .startOf("month")
            .format("YYYY-MM-DD");
          const [monthResult] = await db
            .select({ count: sql<number>`sum(${usage.count})` })
            .from(usage)
            .where(
              and(eq(usage.formId, formId), gte(usage.period, startOfMonthStr)),
            );

          // Get today's submissions
          const todayStr = moment().format("YYYY-MM-DD");
          const [todayResult] = await db
            .select({ count: sql<number>`sum(${usage.count})` })
            .from(usage)
            .where(and(eq(usage.formId, formId), eq(usage.period, todayStr)));

          // Get chart data (last 30 days)
          const thirtyDaysAgoStr = moment()
            .subtract(29, "days")
            .format("YYYY-MM-DD");

          const dailyStats = await db
            .select({
              date: usage.period,
              count: sql<number>`sum(${usage.count})`,
            })
            .from(usage)
            .where(
              and(
                eq(usage.formId, formId),
                gte(usage.period, thirtyDaysAgoStr),
              ),
            )
            .groupBy(usage.period)
            .orderBy(usage.period);

          // Fill in missing days
          const chartData = Array.from({ length: 30 }, (_, i) => {
            const date = moment()
              .subtract(29 - i, "days")
              .format("YYYY-MM-DD");
            const stat = dailyStats.find((s) => s.date === date);
            return {
              date,
              submissions: stat ? Number(stat.count) : 0,
            };
          });

          return Response.json({
            stats: {
              total: Number(totalResult?.count || 0),
              thisMonth: Number(monthResult?.count || 0),
              today: Number(todayResult?.count || 0),
            },
            chartData,
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
