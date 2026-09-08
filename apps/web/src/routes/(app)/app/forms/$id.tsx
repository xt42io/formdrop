import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { useState } from "react";
import { Button } from "@formdrop/ui";
import { IntegrationExamplesModal } from "@/components/integration-examples-modal";
import { CodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const Route = createFileRoute("/(app)/app/forms/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation();
  const { id } = Route.useParams();
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  const { data: form, isLoading } = useQuery({
    queryKey: ["form", id],
    queryFn: async () => {
      const response = await appClient.forms.get(id);
      if ("error" in response) {
        throw new Error(response.error);
      }
      return response.form;
    },
  });

  const links = [
    {
      name: "Submissions",
      to: "/app/forms/$id/submissions",
    },
    {
      name: "Analytics",
      to: "/app/forms/$id/analytics",
    },
    {
      name: "Notifications",
      to: "/app/forms/$id/notifications",
    },
    {
      name: "Integrations",
      to: "/app/forms/$id/integrations",
    },
    {
      name: "Settings",
      to: "/app/forms/$id/settings",
    },
  ];
  return (
    <div>
      <IntegrationExamplesModal
        isOpen={showIntegrationModal}
        onClose={() => setShowIntegrationModal(false)}
        formSlug={form?.slug ?? ""}
      />
      <div className="sticky top-0 z-10 mb-6 border-b border-ink-200 bg-white pt-8 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-8 before:bg-white">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-xl font-bold sm:text-2xl">
            {form?.name}
          </h1>
          {!isLoading && (
            <Button
              onClick={() => setShowIntegrationModal(true)}
              variant="outline"
              size="sm"
              icon={<HugeiconsIcon icon={CodeIcon} size={16} />}
            >
              Integration Guide
            </Button>
          )}
        </div>
        {/* Scrolls rather than wraps: a wrapped row would change the height
            of a sticky header, and the underline that springs between tabs
            assumes they share a line. The negative margin and matching padding
            let it bleed to the screen edge, so a half-visible tab reads as
            "there is more this way" instead of as a clipped one. */}
        <nav className="-mx-4 flex gap-6 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:gap-8 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {links.map((link) => {
            const isActive = location.pathname === link.to.replace("$id", id);
            return (
              <Link
                to={link.to}
                params={{ id }}
                key={link.name}
                className={`relative shrink-0 px-1 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-accent-600"
                    : "text-ink-600 hover:text-ink-950"
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    className="absolute right-0 -bottom-px left-0 h-0.5 rounded-full bg-accent-500"
                    layoutId="form-tab-underline"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
