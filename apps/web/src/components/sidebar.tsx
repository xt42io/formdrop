import {
  AddToListIcon,
  Cancel01Icon,
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

/**
 * Whether the md rail layout is the one on screen.
 *
 * The collapse preference is a property of the rail, not of the drawer: a
 * drawer you deliberately opened should show its labels even if you last left
 * the desktop sidebar collapsed. Without this, a stored "collapsed" gave a
 * 288px drawer containing a 72px rail's contents -- no wordmark, centred
 * icons, no upsell.
 *
 * Starts true so the server and the first client render agree with the
 * desktop-first markup, and settles in an effect -- the same shape as
 * useCollapsed above, and for the same reason.
 */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 48rem)");
    const apply = () => setIsDesktop(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return isDesktop;
}

export interface SidebarProps {
  /** Below md the sidebar is an off-canvas drawer; this is whether it is out. */
  mobileOpen?: boolean;
  /** Closes the drawer -- on a link tap, or on the drawer's own close button. */
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { collapsed, toggle } = useCollapsed();
  const isDesktop = useIsDesktop();
  // Collapsed only means anything to the rail.
  const railCollapsed = collapsed && isDesktop;

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
      /*
       * Two layouts in one element.
       *
       * From md up it is what it always was: an in-flow rail whose width the
       * collapse toggle animates.
       *
       * Below md it is a fixed drawer sitting off the left edge until opened.
       * A 288px rail against a 375px viewport left `main` 129px, and with its
       * px-16 that came to a content box of zero -- the dashboard was not
       * narrow on a phone, it was empty.
       *
       * `h-full` is deliberately md-only. A fixed element's containing block
       * is the viewport, so h-full there would be 100vh and, offset 8px down
       * by top-2, would hang 8px past the bottom; top-2/bottom-2 sizes it
       * correctly instead.
       *
       * The collapsed widths are md-only too -- a drawer you have deliberately
       * opened should not also be able to be a 72px rail.
       *
       * The transition names `translate`, not `transform`. Tailwind v4 compiles
       * translate-x-* to the standalone `translate` property -- the same reason
       * tokens.css animates `translate` in animate-enter -- so a transition
       * list naming `transform` covers a property that never changes and the
       * drawer snaps open with no animation at all.
       */
      className={`fixed top-2 bottom-2 left-2 z-50 flex w-72 min-w-72 flex-col justify-between gap-4 overflow-hidden rounded-panel border border-ink-200 bg-white p-2 transition-[width,min-width,translate] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:h-full md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+0.75rem)]"
      } ${
        railCollapsed
          ? "md:w-[4.5rem] md:min-w-[4.5rem]"
          : "md:w-72 md:min-w-72"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div
          className={`flex items-center pt-3 transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            railCollapsed ? "px-0" : "px-5"
          }`}
        >
          <span
            className={`overflow-hidden transition-[max-width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              railCollapsed ? "max-w-0" : "max-w-40"
            }`}
          >
            <img
              src="/purple_wordmark.png"
              alt="FormDrop"
              className="w-30 max-w-none"
            />
          </span>
          {/* Two buttons rather than one that branches on a media query:
              reading the viewport in JS to decide would risk a hydration
              mismatch, and CSS already knows which layout is on screen. */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="ml-auto shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 md:hidden"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={railCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!railCollapsed}
            className={`hidden shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 md:block ${
              railCollapsed ? "mx-auto" : "ml-auto"
            }`}
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
                // gap-0 when collapsed is load-bearing. The label stays
                // mounted at zero width so it can be clipped smoothly, but a
                // gap still applies between it and the icon -- so centring
                // measured icon+gap+label and put the icon 6px left of the
                // pill it sits in.
                className={`relative flex items-center overflow-hidden rounded-2xl transition-[background-color,color,width] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
                  railCollapsed
                    ? "h-11 w-11 justify-center gap-0 px-0"
                    : "h-11 w-full gap-3 px-4"
                } ${
                  isActive
                    ? "text-accent-600"
                    : "text-ink-600 hover:text-ink-950"
                }`}
              >
                {isActive && (
                  <motion.div
                    // Keyed by collapse state on purpose. With one shared id,
                    // collapsing made the indicator animate from a 270px pill
                    // to a 44px square -- a shape morph nobody asked for. Two
                    // ids means collapsing swaps it instantly while moving
                    // between links still slides, which is what it is for.
                    layoutId={`sidebar-active-link-${railCollapsed ? "rail" : "wide"}`}
                    className="absolute inset-0 rounded-2xl bg-accent-500/12"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <HugeiconsIcon
                  icon={link.icon}
                  size={20}
                  className="relative z-10 shrink-0"
                />
                <span
                  className={`relative z-10 overflow-hidden text-sm font-medium whitespace-nowrap transition-[max-width] duration-200 ${
                    railCollapsed ? "max-w-0" : "max-w-40"
                  }`}
                >
                  {link.name}
                </span>
              </Link>
            );

            // Collapsed, the icon is the only label there is.
            //
            // The extra wrapper is load-bearing: Tooltip renders an
            // inline-flex element, which shrink-wraps its child instead of
            // filling the rail, so the icons sat 17px left of the centre the
            // toggle above them is on. This re-centres them.
            return railCollapsed ? (
              <div key={link.path} className="flex justify-center">
                <Tooltip content={link.name}>{item}</Tooltip>
              </div>
            ) : (
              item
            );
          })}
        </nav>
      </div>

      {!isSubscriptionPending && !isPro && !railCollapsed && (
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
              className="relative z-10 w-full cursor-pointer rounded-3xl bg-accent-500 py-3 text-xs font-medium text-white transition-colors hover:bg-accent-600 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
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
            {!railCollapsed && (
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="h-4 w-24 animate-pulse rounded bg-ink-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-ink-100" />
              </div>
            )}
          </div>
        ) : session?.user ? (
          <div
            className={`flex w-full items-center gap-3 ${railCollapsed ? "justify-center" : "justify-between"}`}
          >
            <div className="flex min-w-0 items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500/10 font-medium text-accent-600">
                {session.user.name?.charAt(0).toUpperCase() ||
                  session.user.email?.charAt(0).toUpperCase()}
              </div>
              {!railCollapsed && (
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
            {!railCollapsed && (
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
