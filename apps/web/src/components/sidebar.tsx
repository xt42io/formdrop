import {
  AddToListIcon,
  AnalyticsUpIcon,
  Key01Icon,
  Logout01Icon,
  Settings02Icon,
  SidebarLeftIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Tooltip } from "@formdrop/ui";
import { quotaFor } from "@formdrop/core";
import { useSession, signOut } from "@/lib/auth-client";
import { appClient } from "@/lib/app-client";
import { UpgradeModal } from "./upgrade-modal";

/**
 * The dashboard shell's sidebar, rebuilt on tokens (W4 section 4.5).
 *
 * Three things the PRD asks for beyond the repaint: collapse-to-icons, and the
 * quota display moved into the upsell card so a free user can see what they
 * have left without opening settings. The command palette and the header form
 * switcher are the remaining two and are not here.
 *
 * Colours all come from the ramps now. The active-link icon in particular
 * carried the brand violet as a literal hex prop -- which W4's acceptance
 * forbids outright -- and inherits from the link instead.
 */
const LINKS = [
  { name: "Forms", path: "/app/forms", icon: AddToListIcon },
  { name: "Analytics", path: "/app/analytics", icon: AnalyticsUpIcon },
  { name: "API Keys", path: "/app/api-keys", icon: Key01Icon },
  { name: "Settings", path: "/app/settings", icon: Settings02Icon },
];

const COLLAPSED_KEY = "formdrop:sidebar-collapsed";

function useCollapsed() {
  // Starts expanded on the server and on the first client render, so the two
  // agree; the stored preference is applied in an effect. Reading
  // localStorage during render would hydrate-mismatch for anyone who collapsed.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // Private mode, or storage disabled. Expanded is a fine answer.
    }
  }, []);

  const toggle = () => {
    setCollapsed((wasCollapsed) => {
      const next = !wasCollapsed;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Preference simply will not persist.
      }
      return next;
    });
  };

  return { collapsed, toggle };
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { collapsed, toggle } = useCollapsed();

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

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: { onSuccess: () => navigate({ to: "/login" }) },
    });
  };

  return (
    <div
      className={`flex h-full flex-col justify-between gap-4 rounded-panel border border-ink-200 bg-white p-2 transition-[width] duration-200 ${
        collapsed ? "w-[4.5rem] min-w-[4.5rem]" : "w-72 min-w-72"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div
          className={`flex items-center pt-3 ${collapsed ? "justify-center px-0" : "justify-between px-5"}`}
        >
          {!collapsed && (
            <img src="/purple_wordmark.png" alt="FormDrop" className="w-30" />
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="cursor-pointer rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
          >
            <HugeiconsIcon icon={SidebarLeftIcon} size={18} />
          </button>
        </div>

        <nav className="mt-7 flex flex-col gap-y-1.5">
          {LINKS.map((link) => {
            const isActive = location.pathname.startsWith(link.path);

            const item = (
              <Link
                to={link.path}
                key={link.path}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-4xl py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
                  collapsed ? "justify-center px-0" : "px-4"
                } ${
                  isActive
                    ? "text-accent-600"
                    : "text-ink-600 hover:text-ink-950"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-link"
                    className="absolute inset-0 rounded-4xl bg-accent-500/12"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <HugeiconsIcon
                  icon={link.icon}
                  size={20}
                  className="relative z-10 shrink-0"
                />
                {!collapsed && (
                  <span className="relative z-10 text-sm font-medium">
                    {link.name}
                  </span>
                )}
              </Link>
            );

            // Collapsed, the icon is the only label there is.
            return collapsed ? (
              <Tooltip key={link.path} content={link.name}>
                {item}
              </Tooltip>
            ) : (
              item
            );
          })}
        </nav>
      </div>

      {!isSubscriptionPending && !isPro && !collapsed && (
        <div className="px-2">
          <div className="group relative overflow-hidden rounded-card border border-accent-500/10 bg-linear-to-br from-accent-500/5 to-accent-500/20 p-4">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-accent-500/10 blur-2xl transition-colors duration-500 group-hover:bg-accent-500/15" />

            <div className="relative z-10 mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-accent-500/10 p-1.5 text-accent-600">
                <HugeiconsIcon icon={SparklesIcon} size={14} />
              </div>
              <h3 className="text-sm font-semibold text-ink-950">
                Upgrade to Pro
              </h3>
            </div>

            {/* W4: the quota lives here now rather than only in settings. */}
            <div className="relative z-10 mb-3">
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="text-ink-600">Submissions this month</span>
                <span className="font-medium text-ink-950 tabular-nums">
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
                    quota.exceeded ? "bg-red-500" : "bg-accent-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (quota.used / quota.limit) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="relative z-10 w-full cursor-pointer rounded-3xl bg-accent-500 py-3 text-xs font-medium text-white shadow-sm shadow-accent-500/20 transition-all hover:bg-accent-600 hover:shadow-accent-500/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      <div className="w-full border-t border-ink-100 p-4">
        {isPending ? (
          <div className="flex w-full items-center gap-3">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-ink-100" />
            {!collapsed && (
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="h-4 w-24 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-ink-100" />
              </div>
            )}
          </div>
        ) : session?.user ? (
          <div
            className={`flex w-full items-center gap-3 ${collapsed ? "justify-center" : "justify-between"}`}
          >
            <div className="flex min-w-0 items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500/10 font-medium text-accent-600">
                {session.user.name?.charAt(0).toUpperCase() ||
                  session.user.email?.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-ink-950">
                    {session.user.name}
                  </span>
                  <span className="truncate text-xs text-ink-500">
                    {session.user.email}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleSignOut}
                className="cursor-pointer rounded-lg p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
                title="Sign out"
                aria-label="Sign out"
              >
                <HugeiconsIcon icon={Logout01Icon} size={20} />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
