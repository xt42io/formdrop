import {
  AddToListIcon,
  AnalyticsUpIcon,
  Key01Icon,
  Settings02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@formdrop/ui";
import { quotaFor } from "@formdrop/core";
import { appClient } from "@/lib/app-client";
import {
  DashboardSidebar,
  type SidebarLink,
} from "@/components/dashboard-sidebar";
import { UpgradeModal } from "./upgrade-modal";

/**
 * The account dashboard's sidebar (W4 section 4.5).
 *
 * The shell -- collapse to icons, the mobile drawer, the active indicator, the
 * account footer -- is DashboardSidebar, shared with the admin surface so the
 * two cannot drift. What is here is what belongs to this surface: the links,
 * and the upsell card with the quota in it.
 */
const LINKS: SidebarLink[] = [
  { name: "Forms", path: "/app/forms", icon: AddToListIcon },
  { name: "Analytics", path: "/app/analytics", icon: AnalyticsUpIcon },
  { name: "API Keys", path: "/app/api-keys", icon: Key01Icon },
  { name: "Settings", path: "/app/settings", icon: Settings02Icon },
];

export interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { data: subscriptionData, isPending: isSubscriptionPending } = useQuery(
    {
      queryKey: ["subscription"],
      queryFn: () => appClient.subscription.get(),
    },
  );

  const { data: analyticsData } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => appClient.analytics.get(),
  });

  const status =
    subscriptionData && "subscription" in subscriptionData
      ? subscriptionData.subscription?.status
      : undefined;

  const isPro = status === "active";

  // The same helper the settings page reads from, so the two cannot disagree
  // about what a plan allows.
  const quota = quotaFor(
    status,
    analyticsData && "stats" in analyticsData
      ? analyticsData.stats.submissionsThisMonth
      : 0,
  );

  return (
    <DashboardSidebar
      surface="app"
      links={LINKS}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    >
      {/*
        The upsell only exists on this surface, so it is passed in rather than
        living in the shared shell. It hides when the rail is collapsed -- a
        72px column has nowhere to put a progress bar -- which the shell
        cannot decide on its caller's behalf, hence the `hidden md:block`
        pairing below rather than a `railCollapsed` prop leaking outward.
      */}
      {!isSubscriptionPending && !isPro && (
        <div className="px-2 group-data-[rail=collapsed]/sidebar:hidden">
          <div className="group relative overflow-hidden rounded-card border border-accent-500/10 bg-linear-to-br from-accent-500/5 to-accent-500/20 p-4">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-accent-500/10 blur-2xl transition-colors duration-500 group-hover:bg-accent-500/15" />

            <div className="relative z-10 mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-accent-500/10 p-1.5 text-accent-600">
                <Icon icon={SparklesIcon} size={14} />
              </div>
              <h3 className="text-sm font-semibold whitespace-nowrap text-ink-950">
                Upgrade to Pro
              </h3>
            </div>

            {/* W4: the quota lives here now rather than only in settings. */}
            <div className="relative z-10 mb-3">
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
                <span className="whitespace-nowrap text-ink-600">
                  Submissions this month
                </span>
                <span className="font-medium whitespace-nowrap text-ink-950 tabular-nums">
                  {quota.used.toLocaleString()}/{quota.limit.toLocaleString()}
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-accent-500/15"
                role="progressbar"
                aria-valuenow={quota.used}
                aria-valuemin={0}
                aria-valuemax={quota.limit}
                aria-label="Submissions used this month"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    // tint-rose-ink rather than a stock red: the billing panel
                    // draws the same meter from the same quota, and two bars
                    // reporting one fact in two different reds is a bug
                    // waiting to be noticed.
                    quota.exceeded ? "bg-tint-rose-ink" : "bg-accent-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (quota.used / quota.limit) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="relative z-10 w-full cursor-pointer rounded-3xl bg-accent-500 py-3 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-accent-600 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
            >
              Upgrade Plan
            </button>
          </div>

          <UpgradeModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
          />
        </div>
      )}
    </DashboardSidebar>
  );
}
