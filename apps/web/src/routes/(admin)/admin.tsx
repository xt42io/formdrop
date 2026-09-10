import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon } from "@formdrop/ui";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { AdminSidebar } from "@/components/admin-sidebar";
import { isCallerAdmin } from "@/lib/route-guards";

export const Route = createFileRoute("/(admin)/admin")({
  /*
   * The role check, on the server (PRD 4.6).
   *
   * beforeLoad runs during SSR on a full page load, so a non-admin never
   * receives admin markup at all -- and on a client navigation it is an RPC,
   * so the answer still comes from the server. What this replaces decided in
   * the component from a client-held session: the shell painted first and the
   * check was running on the visitor's side of the wire.
   */
  beforeLoad: async () => {
    const { isAdmin } = await isCallerAdmin();
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  // Below md the sidebar is a drawer, so the layout owns whether it is open --
  // it also renders the bar holding the button that opens it. Same shape as
  // the account dashboard's layout.
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Tapping a link inside the drawer should not leave it covering the page you
  // just asked for. Keyed on pathname so any navigation closes it.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    // The same shell as the account dashboard: canvas ground, the faint rule
    // grid masked at the corner, and a rounded panel for the content.
    <div className="relative isolate flex h-screen gap-2 bg-canvas p-2">
      <div
        aria-hidden
        className="bg-lines pointer-events-none absolute inset-0 -z-10 mask-[radial-gradient(120%_80%_at_0%_0%,black_0%,transparent_70%)]"
      />

      <div
        aria-hidden
        onClick={() => setNavOpen(false)}
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
          navOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <AdminSidebar
        mobileOpen={navOpen}
        onCloseMobile={() => setNavOpen(false)}
      />

      <main className="flex w-full flex-col overflow-y-auto rounded-panel border border-ink-200 bg-white">
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
          <div className="flex items-center gap-2">
            <img
              src="/purple_wordmark.png"
              alt="FormDrop"
              className="w-24 max-w-none"
            />
            <span className="rounded-full bg-accent-500/12 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
              Admin
            </span>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 md:px-16 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
