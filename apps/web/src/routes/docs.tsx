import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { capture } from "@formdrop/analytics";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { Navbar } from "@/components/landing/navbar";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  // Captured in the layout rather than in each page, so the five pages need no
  // instrumentation of their own and neither will the pages that replace them.
  const { pathname } = useLocation();

  useEffect(() => {
    capture("docs_viewed", { page: pathname });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        <DocsSidebar />
        <main className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
