import {
  createFileRoute,
  Navigate,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Icon } from "@formdrop/ui";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { AdminSidebar } from "@/components/admin-sidebar";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/(admin)/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: session, isPending } = useSession();

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

  if (isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <img src="/purple_icon.svg" alt="" className="h-10 w-10" />
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-accent-500" />
          </div>
        </div>
      </div>
    );
  }

  /*
   * Client-side, and worth being clear about: this hides the shell, it does
   * not protect the data. Every /api/admin handler checks the role
   * server-side, which is what actually matters -- PRD 4.6 asks for that and
   * it is in place. What is still missing is a server-side guard on the route
   * itself, so the shell paints for an instant before redirecting.
   */
  if (!session || session.user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

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
