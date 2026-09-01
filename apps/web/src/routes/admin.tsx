import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <img src="purple_icon.svg" alt="" />
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent animate-[loading_1.5s_ease-in-out_infinite]"
              style={{
                animation: "loading 1.5s ease-in-out infinite",
                width: "40%",
                transform: "translateX(-100%)",
              }}
            />
          </div>
          <style>{`
            @keyframes loading {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(250%); }
              100% { transform: translateX(-100%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-2 bg-gray-100 h-screen gap-2 flex">
      <AdminSidebar />
      <div className="bg-white rounded-2xl border border-gray-200 w-full py-5 px-20 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
