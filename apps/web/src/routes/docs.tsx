import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { Navbar } from "@/components/landing/navbar";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
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
