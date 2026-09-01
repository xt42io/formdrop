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
import { Button } from "@/components/button";
import { IntegrationExamplesModal } from "@/components/integration-examples-modal";
import { CodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const Route = createFileRoute("/app/forms/$id")({
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
        formSlug={form?.slug!}
      />
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 mb-6 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{form?.name}</h1>
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
        <nav className="flex gap-8">
          {links.map((link) => {
            const isActive =
              location.pathname ===
              link.to.replace("$id", Route.useParams().id);
            return (
              <Link
                to={link.to}
                params={{ id: Route.useParams().id }}
                key={link.name}
                className="relative py-2 px-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className={isActive ? "text-accent" : ""}>
                  {link.name}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                    layoutId="underline"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
