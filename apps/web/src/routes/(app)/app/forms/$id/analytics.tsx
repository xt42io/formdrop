import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import moment from "moment";
import { appClient } from "@/lib/app-client";
import { StatStrip } from "@/components/stat-strip";
import { comparePeriods, sumRecent, useChartTheme } from "@/lib/chart-theme";

export const Route = createFileRoute("/(app)/app/forms/$id/analytics")({
  head: () => ({
    meta: [{ title: "Analytics | FormDrop" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const theme = useChartTheme();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", id],
    queryFn: async () => {
      const response = await appClient.submissions.analytics(id);
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response;
    },
  });

  const header = (
    <div>
      <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
        Analytics
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        How this form has been collecting over the last 30 days.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((tile) => (
            <div
              key={tile}
              className="h-32 animate-pulse rounded-panel bg-ink-100"
            />
          ))}
        </div>
        <div className="mt-3 h-96 animate-pulse rounded-panel bg-ink-100" />
      </div>
    );
  }

  const { stats, chartData } = data ?? {
    stats: { total: 0, thisMonth: 0, today: 0 },
    chartData: [],
  };

  // Both derived from the series already on the page rather than a second
  // request. The count is computed independently of the comparison: a form
  // with nine days of history has no previous week to compare against, but it
  // certainly has a last-seven-days figure, and reading it off `comparison`
  // showed that form a zero.
  const last7 = sumRecent(chartData);
  const comparison = comparePeriods(chartData);

  return (
    <div>
      {header}

      <StatStrip
        stats={[
          {
            label: "Total submissions",
            value: stats.total,
            detail: "all time",
            feature: true,
          },
          {
            label: "Last 7 days",
            value: last7,
            delta: comparison,
            detail: comparison ? "vs previous 7" : "not enough history yet",
          },
          {
            label: "Today",
            value: stats.today,
            detail: `${stats.thisMonth.toLocaleString()} this month`,
          },
        ]}
      />

      <div className="animate-enter-late mt-3 rounded-panel border border-ink-200 bg-white p-6">
        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="text-base font-semibold text-ink-950">
            Submission history
          </h3>
          <span className="text-xs text-ink-500">Last 30 days</span>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
            >
              <defs>
                {/* Every colour below comes from the token file, read back at
                    runtime -- Recharts takes strings, so a class cannot reach
                    it, and hard-coding them is what W4 forbids. */}
                <linearGradient
                  id="submissionsFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={theme.accent}
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="100%"
                    stopColor={theme.accent}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme.grid}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.tick, fontSize: 11 }}
                tickFormatter={(value: string) => moment(value).format("MMM D")}
                dy={8}
                minTickGap={28}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.tick, fontSize: 11 }}
                allowDecimals={false}
                width={44}
              />
              <Tooltip
                cursor={{ stroke: theme.accent, strokeWidth: 1 }}
                labelFormatter={(value: string) =>
                  moment(value).format("dddd, MMM D")
                }
                formatter={(value: number) => [value, "Submissions"]}
                contentStyle={{
                  backgroundColor: theme.surface,
                  borderRadius: "12px",
                  border: `1px solid ${theme.border}`,
                  fontSize: "12px",
                }}
              />
              {/* isAnimationActive is off deliberately. Recharts animates
                  the series up from a flat baseline, so if those frames do
                  not run -- a background tab, a throttled device -- the
                  chart is left drawing a straight line at zero, which is not
                  a missing flourish but wrong data. tokens.css makes the
                  same argument for entrance utilities, and W4 requires
                  prefers-reduced-motion to disable entrance animation
                  anyway. */}
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="submissions"
                stroke={theme.accent}
                strokeWidth={2}
                fill="url(#submissionsFill)"
                fillOpacity={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
