import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { StatStrip } from "@/components/stat-strip";
import { comparePeriods, sumRecent, useChartTheme } from "@/lib/chart-theme";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/(app)/app/analytics")({
  head: () => ({
    meta: [{ title: "Analytics | FormDrop" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const theme = useChartTheme();
  const { data, isLoading } = useQuery({
    queryKey: ["global-analytics"],
    queryFn: async () => {
      const response = await appClient.analytics.get();
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response;
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="h-8 w-48 bg-ink-100 rounded-lg animate-pulse mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-ink-100 rounded-panel animate-pulse"
            ></div>
          ))}
        </div>
        <div className="h-96 bg-ink-100 rounded-panel animate-pulse mb-8"></div>
        <div className="h-64 bg-ink-100 rounded-panel animate-pulse"></div>
      </div>
    );
  }

  const { stats, chartData, topForms } = data || {
    stats: { totalForms: 0, totalSubmissions: 0, submissionsThisMonth: 0 },
    chartData: [],
    topForms: [],
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
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Everything your forms have collected, across the account.
        </p>
      </div>

      <StatStrip
        stats={[
          {
            label: "Total submissions",
            value: stats.totalSubmissions,
            detail: `across ${stats.totalForms.toLocaleString()} forms`,
            feature: true,
          },
          {
            label: "Last 7 days",
            value: last7,
            delta: comparison,
            detail: comparison ? "vs previous 7" : "not enough history yet",
          },
          {
            label: "Last 30 days",
            value: stats.submissionsThisMonth,
            detail: "rolling window",
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 p-6 border border-ink-200 rounded-panel bg-white">
          <h3 className="text-lg font-semibold mb-6">Submission History</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="colorSubmissions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={theme.accent}
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="95%"
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
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme.tick, fontSize: 11 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.surface,
                    borderRadius: "12px",
                    border: `1px solid ${theme.border}`,
                  }}
                  itemStyle={{ fontWeight: 600 }}
                  cursor={{ stroke: theme.accent, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stroke={theme.accent}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubmissions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 border border-ink-200 rounded-panel bg-white h-fit">
          <h3 className="text-lg font-semibold mb-6">Top Performing Forms</h3>
          {topForms.length === 0 ? (
            <div className="text-center py-8 text-ink-500">
              No data available yet
            </div>
          ) : (
            <div className="space-y-4">
              {topForms.map((form, index) => (
                <Link
                  key={form.id}
                  to="/app/forms/$id/analytics"
                  params={{ id: form.id }}
                  className="flex items-center justify-between p-3 hover:bg-ink-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-ink-100 text-sm font-semibold text-ink-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-ink-950">{form.name}</p>
                      <p className="text-xs text-ink-500">
                        {form.submissionCount.toLocaleString()} submissions
                      </p>
                    </div>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    className="text-ink-400 group-hover:text-ink-950 transition-colors"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
