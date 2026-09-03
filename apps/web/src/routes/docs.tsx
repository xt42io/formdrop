import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen01Icon, CodeIcon } from "@hugeicons/core-free-icons";
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

  // The API reference is the one page that belongs to the other tab, so the
  // split is derived rather than driven by activeProps.
  const onApiTab = pathname.startsWith("/docs/api");

  const tabs = [
    {
      label: "Documentation",
      href: "/docs",
      icon: BookOpen01Icon,
      active: !onApiTab,
    },
    {
      label: "API Reference",
      href: "/docs/api",
      icon: CodeIcon,
      active: onApiTab,
    },
  ] as const;

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-white">
      {/* the same backdrop as the marketing pages, so docs read as part of the
          product rather than a bolted-on subsite */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] overflow-hidden"
      >
        <div className="absolute inset-0 bg-lines mask-[linear-gradient(to_bottom,#000_0%,#000_45%,transparent_92%)]" />
        <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
      </div>

      <Navbar />

      <div className="mt-6 border-b border-ink-100">
        <div className="mx-auto flex w-full max-w-6xl gap-1 px-6">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              to={tab.href}
              className={`relative flex items-center gap-2 px-3 py-3 text-[13px] font-semibold transition-colors ${
                tab.active ? "text-ink-950" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={15} />
              {tab.label}
              {/* A shared layoutId, so the rule slides between tabs rather than
                  cutting. It carries no entrance opacity, so a frame-starved
                  tab still shows the rule under the active tab. */}
              {tab.active && (
                <motion.span
                  layoutId="docs-tab-rule"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-500"
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-6 pt-12 pb-24">
        <DocsSidebar />
        {/* No card around the prose: a border and a white panel on a white page
            only boxed the text in. The measure does the work instead. */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
