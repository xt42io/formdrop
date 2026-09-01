import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/forms/$id/analytics")({
  head: () => ({
    meta: [{ title: "Analytics | FormDrop" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

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

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-x-3 py-2">
          <Link
            to="/app/forms"
            className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </Link>
          <h2 className="text-lg font-semibold">Analytics</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
        <div className="mt-4 h-96 bg-gray-100 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  const { stats, chartData } = data || {
    stats: { total: 0, thisMonth: 0, today: 0 },
    chartData: [],
  };

  return (
    <div>
      <div className="flex items-center gap-x-3 py-2">
        <Link
          to="/app/forms"
          className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        </Link>
        <h2 className="text-lg font-semibold">Analytics</h2>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border border-gray-200 rounded-3xl bg-white">
          <p className="text-sm font-medium text-gray-500">Total Submissions</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.total.toLocaleString()}
          </p>
        </div>
        <div className="p-6 border border-gray-200 rounded-3xl bg-white">
          <p className="text-sm font-medium text-gray-500">This Month</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.thisMonth}
          </p>
        </div>
        <div className="p-6 border border-gray-200 rounded-3xl bg-white">
          <p className="text-sm font-medium text-gray-500">Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.today.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-6 p-6 border border-gray-200 rounded-3xl bg-white">
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
                stroke="#f3f4f6"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                dy={10}
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
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
    </div>
  );
}
