import { createFileRoute } from "@tanstack/react-router";
import {
  UserGroupIcon,
  File01Icon,
  AnalyticsUpIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@formdrop/ui";
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
import { palette } from "@formdrop/ui";
import { useChartTheme } from "@/lib/chart-theme";
import { adminClient } from "@/lib/admin-client";

/*
 * The second chart's series, kept visually distinct from the first without
 * reaching for emerald-500. Recharts takes colour strings, so this is a value
 * rather than a class -- see packages/ui/src/palette.ts.
 */
const SERIES_TWO = palette["tint-green-ink"];

export const Route = createFileRoute("/(admin)/admin/")({
  component: AdminDashboard,
});

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  const iconColor = color.replace("bg-", "").replace("-500", "");
  const bgClass = `bg-${iconColor}-500/10`;
  const iconClass = `text-${iconColor}-500`;

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-xl ${bgClass}`}>
          <Icon icon={icon} size={24} className={iconClass} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {typeof value === "number" ? value.toLocaleString() : value}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6">
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse"></div>
        <div className="ml-5 flex-1">
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2"></div>
          <div className="h-8 w-16 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6">
      <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-6"></div>
      <div className="h-[300px] bg-gray-100 rounded-2xl animate-pulse"></div>
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>

        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your application.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Users"
          value={stats?.totals?.users || 0}
          icon={UserGroupIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Forms"
          value={stats?.totals?.forms || 0}
          icon={File01Icon}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totals?.submissions || 0}
          icon={AnalyticsUpIcon}
          color="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Users Over Time Chart */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            User Growth (Last 30 Days)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.charts?.usersOverTime || []}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={theme.accent}
                      stopOpacity={0.1}
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
                  tick={{ fill: theme.tick, fontSize: 12 }}
                  dy={10}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme.tick, fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.surface,
                    borderRadius: "12px",
                    border: `1px solid ${theme.border}`,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ stroke: theme.accent, strokeWidth: 1 }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="count"
                  stroke={theme.accent}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  name="New Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Submissions Over Time Chart */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Submissions (Last 30 Days)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.charts?.submissionsOverTime || []}>
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
                      stopColor={SERIES_TWO}
                      stopOpacity={0.1}
                    />
                    <stop offset="95%" stopColor={SERIES_TWO} stopOpacity={0} />
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
                  tick={{ fill: theme.tick, fontSize: 12 }}
                  dy={10}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: theme.tick, fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.surface,
                    borderRadius: "12px",
                    border: `1px solid ${theme.border}`,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ stroke: SERIES_TWO, strokeWidth: 1 }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="count"
                  stroke={SERIES_TWO}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubmissions)"
                  name="Submissions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Forms Chart */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Top Forms by Submissions
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.charts?.topForms || []}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme.grid}
              />
              <XAxis
                dataKey="formName"
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.tick, fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.tick, fontSize: 12 }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.surface,
                  borderRadius: "12px",
                  border: `1px solid ${theme.border}`,
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                cursor={{ fill: palette["ink-50"] }}
              />
              <Bar
                isAnimationActive={false}
                dataKey="count"
                fill={theme.accent}
                name="Submissions"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
