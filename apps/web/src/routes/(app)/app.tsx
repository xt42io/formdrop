import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon, PlanGateProvider } from "@formdrop/ui";
import { Menu01Icon } from "@hugeicons/core-free-icons";
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

  // Below md the sidebar is a drawer, so something has to own whether it is
  // open. The layout does, because it also renders the bar holding the button
  // that opens it.
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Tapping a link inside the drawer should not leave it covering the page you
  // just asked for. Keyed on pathname rather than handled per link, so a
  // navigation from anywhere -- including the logo, or a redirect -- closes it.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

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

        {/* Dims the page behind the open drawer and gives it a large, obvious
            target to close against. md:hidden because from md up the sidebar
            is in the flow and there is nothing to dismiss. */}
        <div
          aria-hidden
          onClick={() => setNavOpen(false)}
          className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
            navOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <Sidebar mobileOpen={navOpen} onCloseMobile={() => setNavOpen(false)} />

        <main className="flex w-full flex-col overflow-y-auto rounded-panel border border-ink-200 bg-white">
          {/* The only way to reach navigation below md. Sticky, so it stays
              reachable down a long submissions list, and inside the scroll
              container so it does not need to know the page's padding. */}
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur-sm md:hidden">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              aria-expanded={navOpen}
              className="cursor-pointer rounded-lg p-1.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <Icon icon={Menu01Icon} size={20} />
            </button>
            <img
              src="/purple_wordmark.png"
              alt="FormDrop"
              className="w-24 max-w-none"
            />
          </div>

          {/* px-16 is a desktop measure. On a 375px screen it left nothing
              between the two paddings for the page to occupy. */}
          <div className="px-4 py-6 sm:px-6 md:px-16 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </PlanGateProvider>
  );
}
