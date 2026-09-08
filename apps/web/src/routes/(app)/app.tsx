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
      {/* The shell sits on the canvas token rather than flat grey, with the
          same faint rule grid the landing page uses, masked so it fades out
          before it reaches the content. W4 4.1: atmosphere, not decoration. */}
      <div className="relative isolate flex h-screen gap-2 bg-canvas p-2">
        <div
          aria-hidden
          className="bg-lines pointer-events-none absolute inset-0 -z-10 mask-[radial-gradient(120%_80%_at_0%_0%,black_0%,transparent_70%)]"
        />
        <Sidebar />
        <main className="w-full overflow-y-auto rounded-panel border border-ink-200 bg-white px-16 py-8">
          <Outlet />
        </main>
      </div>
    </PlanGateProvider>
  );
}
