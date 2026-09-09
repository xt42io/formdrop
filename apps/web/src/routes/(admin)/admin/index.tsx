import { createFileRoute } from "@tanstack/react-router";
import {
  AnalyticsUpIcon,
  File01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Icon, palette } from "@formdrop/ui";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import moment from "moment";
import { useChartTheme } from "@/lib/chart-theme";
import { adminClient } from "@/lib/admin-client";
import { StatStrip } from "@/components/stat-strip";

/**
 * The platform overview (PRD 4.6).
 *
 * Rebuilt on the same primitives as the account dashboard rather than kept as
 * the screen that looks like the old product: StatStrip for the figures,
 * rounded-panel surfaces, the shared chart theme, the same heading scale.
 *
 * The PRD's brief for this screen is "is the platform healthy, without opening
 * the database", so submissions is the feature tile -- it is the number that
 * says whether the product is doing its job.
 */
export const Route = createFileRoute("/(admin)/admin/")({
  component: AdminDashboard,
});

/*
 * The second series, kept distinct from the first without reaching for
 * emerald-500. Recharts takes colour strings, so this is a value rather than a
 * class -- see packages/ui/src/palette.ts.
 */
const SERIES_TWO = palette["tint-green-ink"];

/** Shared by the three chart panels, so they cannot drift apart. */
function ChartPanel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-enter-late mt-3 rounded-panel border border-ink-200 bg-white p-6">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-ink-950">{title}</h3>
        <span className="text-xs text-ink-500">{caption}</span>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const theme = useChartTheme();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await adminClient.stats();
      if ("error" in response) throw new Error(response.error);
      return response;
    },
  });

  // Rendered by both branches, so it does not arrive late and shove the page
  // down when the query resolves.
  const header = (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
        Platform
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Every account, form and submission on FormDrop.
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {header}
        {/* Shaped like what replaces it -- three tiles at StatStrip's own
            height, then panels at the same gaps -- so nothing moves when the
            data lands. */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((tile) => (
            <div
              key={tile}
              className="h-[7.25rem] animate-pulse rounded-panel bg-ink-100"
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-panel bg-ink-100" />
          <div className="h-96 animate-pulse rounded-panel bg-ink-100" />
        </div>
        <div className="mt-3 h-96 animate-pulse rounded-panel bg-ink-100" />
      </div>
    );
  }

  const totals = stats?.totals;
  const charts = stats?.charts;

  return (
    <div>
      {header}

      <StatStrip
        stats={[
          {
            label: "Submissions",
            value: totals?.submissions ?? 0,
            detail: "all time, every account",
            feature: true,
            icon: <Icon icon={AnalyticsUpIcon} size={14} />,
          },
          {
            label: "Users",
            value: totals?.users ?? 0,
            detail: "registered accounts",
            icon: <Icon icon={UserGroupIcon} size={14} />,
          },
          {
            label: "Forms",
            value: totals?.forms ?? 0,
            detail: "across all accounts",
            icon: <Icon icon={File01Icon} size={14} />,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartPanel title="New users" caption="Last 30 days">
          <AreaChart
            data={charts?.usersOverTime ?? []}
            margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="adminUsersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accent} stopOpacity={0.18} />
                <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
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
              contentStyle={{
                backgroundColor: theme.surface,
                borderRadius: "12px",
                border: `1px solid ${theme.border}`,
                fontSize: "12px",
              }}
            />
            {/* isAnimationActive is off deliberately: Recharts animates a
                series up from a flat baseline, so if those frames never run
                the chart is left drawing zero -- wrong data, not a missing
                flourish. The account charts make the same call. */}
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="count"
              name="Users"
              stroke={theme.accent}
              strokeWidth={2}
              fill="url(#adminUsersFill)"
              fillOpacity={1}
            />
          </AreaChart>
        </ChartPanel>

        <ChartPanel title="Submissions received" caption="Last 30 days">
          <AreaChart
            data={charts?.submissionsOverTime ?? []}
            margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
          >
            <defs>
              <linearGradient id="adminSubsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_TWO} stopOpacity={0.18} />
                <stop offset="100%" stopColor={SERIES_TWO} stopOpacity={0} />
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
              cursor={{ stroke: SERIES_TWO, strokeWidth: 1 }}
              labelFormatter={(value: string) =>
                moment(value).format("dddd, MMM D")
              }
              contentStyle={{
                backgroundColor: theme.surface,
                borderRadius: "12px",
                border: `1px solid ${theme.border}`,
                fontSize: "12px",
              }}
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="count"
              name="Submissions"
              stroke={SERIES_TWO}
              strokeWidth={2}
              fill="url(#adminSubsFill)"
              fillOpacity={1}
            />
          </AreaChart>
        </ChartPanel>
      </div>

      <ChartPanel title="Busiest forms" caption="By submissions received">
        {/*
          No negative left margin here, unlike the two area charts above. This
          axis counts submissions across every account, so its labels run to
          four and five digits -- at the area charts' 44px they were clipped to
          "400" where the value was 1400, which is not a cosmetic problem but a
          wrong number on the screen whose job is reporting numbers.
        */}
        <BarChart
          data={charts?.topForms ?? []}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={theme.grid}
          />
          <XAxis
            dataKey="formName"
            axisLine={false}
            tickLine={false}
            tick={{ fill: theme.tick, fontSize: 11 }}
            dy={8}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: theme.tick, fontSize: 11 }}
            allowDecimals={false}
            width={64}
          />
          <Tooltip
            cursor={{ fill: palette["ink-50"] }}
            contentStyle={{
              backgroundColor: theme.surface,
              borderRadius: "12px",
              border: `1px solid ${theme.border}`,
              fontSize: "12px",
            }}
          />
          <Bar
            isAnimationActive={false}
            dataKey="count"
            name="Submissions"
            fill={theme.accent}
            radius={[8, 8, 0, 0]}
            maxBarSize={56}
          />
        </BarChart>
      </ChartPanel>
    </div>
  );
}
