import { createFileRoute } from "@tanstack/react-router";
import {
  countFormsForUser,
  dailyUsageForUser,
  sumUsageForUser,
  topFormsForUser,
} from "@formdrop/core/data";
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

          const startOfMonthStr = moment()
            .startOf("month")
            .format("YYYY-MM-DD");
          const thirtyDaysAgoStr = moment()
            .subtract(29, "days")
            .format("YYYY-MM-DD");

          const totalForms = await countFormsForUser(userId);
          const totalSubmissions = await sumUsageForUser(userId);
          const submissionsThisMonth = await sumUsageForUser(userId, {
            from: startOfMonthStr,
          });
          const dailyStats = await dailyUsageForUser(userId, thirtyDaysAgoStr);
          const topForms = await topFormsForUser(userId, 5);

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

          return Response.json({
            stats: {
              totalForms,
              totalSubmissions,
              submissionsThisMonth,
            },
            chartData,
            topForms,
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
