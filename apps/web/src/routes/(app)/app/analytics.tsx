import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import moment from "moment";
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

type Range = 7 | 30;

function RouteComponent() {
  const theme = useChartTheme();
  // The API returns a fixed 30-day series, so the range narrows what is
  // already here rather than refetching. Honest either way: 7 and 30 are both
  // windows the data actually covers.
  const [range, setRange] = useState<Range>(30);
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
  const visible = chartData.slice(-range);

  // A form with no submissions is not a top performer. Ranking them and
  // labelling the section "top performing" said the opposite.
  const ranked = topForms.filter((f) => f.submissionCount > 0);
  const busiest = ranked[0]?.submissionCount ?? 0;

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

      <div className="mt-3 rounded-panel border border-ink-200 bg-white p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-ink-950">
            Submission history
          </h3>
          {/* Narrows the window rather than refetching -- see above. */}
          <div
            role="group"
            aria-label="Time range"
            className="flex items-center gap-1 rounded-full border border-ink-200 p-1"
          >
            {([7, 30] as Range[]).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRange(days)}
                aria-pressed={range === days}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                  range === days
                    ? "bg-accent-500 text-white"
                    : "text-ink-600 hover:text-ink-950"
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={visible}
              margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
            >
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
                  <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
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
                contentStyle={{
                  backgroundColor: theme.surface,
                  borderRadius: "12px",
                  border: `1px solid ${theme.border}`,
                }}
                itemStyle={{ fontWeight: 600 }}
                labelFormatter={(value: string) =>
                  moment(value).format("dddd, MMM D")
                }
                formatter={(value: number) => [value, "Submissions"]}
                cursor={{ stroke: theme.accent, strokeWidth: 1 }}
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
                fillOpacity={1}
                fill="url(#colorSubmissions)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Below the chart rather than beside it. In a third-width column the
          longer form names wrapped onto two lines and the chart lost most of
          its horizontal room -- the axis is the thing that needs width. */}
      <div className="mt-3 overflow-hidden rounded-panel border border-ink-200 bg-white">
        <div className="flex items-baseline justify-between border-b border-ink-100 px-6 py-4">
          <h3 className="text-base font-semibold text-ink-950">
            Busiest forms
          </h3>
          <span className="text-xs text-ink-500">All time</span>
        </div>

        {ranked.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-500">
            Nothing collected yet. Once a form receives its first submission it
            shows up here.
          </p>
        ) : (
          <div className="divide-y divide-ink-100">
            {ranked.map((form, index) => (
              <Link
                key={form.id}
                to="/app/forms/$id/analytics"
                params={{ id: form.id }}
                className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-accent-500/4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset"
              >
                <span className="w-4 shrink-0 text-sm font-semibold text-ink-400 tabular-nums">
                  {index + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-950 transition-colors group-hover:text-accent-600">
                    {form.name}
                  </span>
                  {/* Share of the busiest form, so the ranking is legible at a
                      glance instead of only through the numbers. */}
                  <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-ink-100">
                    <span
                      className="block h-full rounded-full bg-accent-500/70"
                      style={{
                        width: `${Math.max(2, (form.submissionCount / busiest) * 100)}%`,
                      }}
                    />
                  </span>
                </span>

                <span className="shrink-0 text-sm font-semibold text-ink-950 tabular-nums">
                  {form.submissionCount.toLocaleString()}
                </span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  className="shrink-0 text-ink-300 transition-colors group-hover:text-accent-600"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
