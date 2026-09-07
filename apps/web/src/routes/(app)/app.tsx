import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PlanGateProvider } from "@formdrop/ui";
import { Sidebar } from "@/components/sidebar";
import { useIsPro } from "@/hooks/use-is-pro";

export const Route = createFileRoute("/(app)/app")({
  component: RouteComponent,
});

function RouteComponent() {
  // <Button requiresPro> used to read the subscription itself, which is what
  // tied it to this app. The layout owns that read now and pushes it down, so
  // every gated control inside the dashboard answers to one query.
  const { isPro } = useIsPro();

  return (
    <PlanGateProvider isPro={Boolean(isPro)}>
      <div className="p-2 bg-gray-100 h-screen gap-2 flex">
        <Sidebar />
        <div className="bg-white rounded-2xl border border-gray-200 w-full py-5 px-20 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </PlanGateProvider>
  );
}
