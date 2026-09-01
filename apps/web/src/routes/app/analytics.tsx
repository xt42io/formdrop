import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
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

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [{ title: "Analytics | FormDrop" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
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
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-3xl animate-pulse"
            ></div>
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-3xl animate-pulse mb-8"></div>
        <div className="h-64 bg-gray-100 rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  const { stats, chartData, topForms } = data || {
    stats: { totalForms: 0, totalSubmissions: 0, submissionsThisMonth: 0 },
    chartData: [],
    topForms: [],
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Global Analytics
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 border border-gray-200 rounded-3xl bg-white">
          <p className="text-sm font-medium text-gray-500">Total Forms</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalForms.toLocaleString()}
          </p>
        </div>
        <div className="p-6 border border-gray-200 rounded-3xl bg-white">
          <p className="text-sm font-medium text-gray-500">Total Submissions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalSubmissions.toLocaleString()}
          </p>
        </div>
        <div className="p-6 border border-gray-200 rounded-3xl bg-white">
          <p className="text-sm font-medium text-gray-500">
            Submissions (30 Days)
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.submissionsThisMonth.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-6 border border-gray-200 rounded-3xl bg-white">
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
                    <stop offset="5%" stopColor="#6f63e4" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6f63e4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#111827", fontWeight: 600 }}
                  cursor={{ stroke: "#6f63e4", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  stroke="#6f63e4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubmissions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 border border-gray-200 rounded-3xl bg-white h-fit">
          <h3 className="text-lg font-semibold mb-6">Top Performing Forms</h3>
          {topForms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No data available yet
            </div>
          ) : (
            <div className="space-y-4">
              {topForms.map((form, index) => (
                <Link
                  key={form.id}
                  to="/app/forms/$id/analytics"
                  params={{ id: form.id }}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{form.name}</p>
                      <p className="text-xs text-gray-500">
                        {form.submissionCount.toLocaleString()} submissions
                      </p>
                    </div>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    className="text-gray-400 group-hover:text-gray-900 transition-colors"
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
