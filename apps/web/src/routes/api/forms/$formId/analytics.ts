import { createFileRoute } from "@tanstack/react-router";
import {
  dailyUsageForForm,
  findOwnedForm,
  sumUsageForForm,
} from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import moment from "moment";
import { json, type HandlerPayload } from "@/lib/api/respond";

const GET = async ({
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
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { formId } = params;

    // Verify form belongs to user
    const form = await findOwnedForm(formId, session.user.id);

    if (!form) {
      return json({ error: "Form not found" }, { status: 404 });
    }

    const startOfMonthStr = moment().startOf("month").format("YYYY-MM-DD");
    const todayStr = moment().format("YYYY-MM-DD");
    const thirtyDaysAgoStr = moment().subtract(29, "days").format("YYYY-MM-DD");

    const total = await sumUsageForForm(formId);
    const thisMonth = await sumUsageForForm(formId, {
      from: startOfMonthStr,
    });
    const today = await sumUsageForForm(formId, { on: todayStr });
    const dailyStats = await dailyUsageForForm(formId, thirtyDaysAgoStr);

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

    return json({
      stats: {
        total,
        thisMonth,
        today,
      },
      chartData,
    });
  } catch (error: any) {
    return json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
};

export type FormsFormidAnalyticsGetResponse = HandlerPayload<typeof GET>;

export const Route = createFileRoute("/api/forms/$formId/analytics")({
  server: { handlers: { GET } },
});
