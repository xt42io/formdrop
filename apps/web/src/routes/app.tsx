import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/sidebar";

export const Route = createFileRoute("/app")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-2 bg-gray-100 h-screen gap-2 flex">
      <Sidebar />
      <div className="bg-white rounded-2xl border border-gray-200 w-full py-5 px-20 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
