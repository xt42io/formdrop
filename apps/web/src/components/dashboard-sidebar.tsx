import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Icon, Tooltip, type IconSvgElement } from "@formdrop/ui";
import {
  Cancel01Icon,
  Logout01Icon,
  SidebarLeftIcon,
} from "@hugeicons/core-free-icons";
import { useSession, signOut } from "@/lib/auth-client";

/**
 * The dashboard shell's sidebar, shared by /app and /admin.
 *
 * PRD 4.6 asks for the admin surface to use "the same shell as the user
 * dashboard, visually distinguished". It had its own instead -- 141 lines that
 * had already drifted a long way: no collapse, no mobile drawer, stock greys,
 * rounded-4xl pills against the app's rounded-2xl, and its own account footer
 * markup. Two sidebars that are meant to look identical will not stay
 * identical, so there is one.
 *
 * What each surface supplies is its links, and what visually separates them is
 * a badge in the header. Everything structural -- collapse, the drawer, the
 * active indicator, tooltips, the account footer -- lives here.
 */
export interface SidebarLink {
  name: string;
  path: string;
  icon: IconSvgElement;
  /**
   * Match the path exactly rather than by prefix.
   *
   * /admin needs this: every other admin route starts with it, so a prefix
   * match lights up Dashboard on every screen.
   */
  exact?: boolean;
}

export interface DashboardSidebarProps {
  links: SidebarLink[];
  /**
   * Which surface this is. Separates the two collapse preferences -- the admin
   * rail and the app rail are different places and should remember
   * independently -- and namespaces the active indicator's layoutId so the two
   * never try to animate into each other.
   */
  surface: "app" | "admin";
  /** The "Admin" marker. Absent on the app surface. */
  badge?: string;
  /** Below md the sidebar is an off-canvas drawer; this is whether it is out. */
  mobileOpen?: boolean;
  /** Closes the drawer -- on a link tap, or the drawer's own close button. */
  onCloseMobile?: () => void;
  /** An extra link under the nav. Admin's "Back to app" sits here. */
  secondaryLink?: SidebarLink;
  /** Rendered above the account footer; the app's upsell card goes here. */
  children?: ReactNode;
}

function collapsedKey(surface: string) {
  return `formdrop:sidebar-collapsed:${surface}`;
}

function useCollapsed(surface: string) {
  // Starts expanded on the server and on the first client render, so the two
  // agree; the stored preference is applied in an effect. Reading
  // localStorage during render would hydrate-mismatch for anyone who collapsed.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(collapsedKey(surface)) === "1");
    } catch {
      // Private mode, or storage disabled. Expanded is a fine answer.
    }
  }, [surface]);

  const toggle = () => {
    setCollapsed((wasCollapsed) => {
      const next = !wasCollapsed;
      try {
        window.localStorage.setItem(collapsedKey(surface), next ? "1" : "0");
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

export function DashboardSidebar({
  links,
  surface,
  badge,
  mobileOpen = false,
  onCloseMobile,
  secondaryLink,
  children,
}: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const { collapsed, toggle } = useCollapsed(surface);
  const isDesktop = useIsDesktop();
  // Collapsed only means anything to the rail.
  const railCollapsed = collapsed && isDesktop;

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: { onSuccess: () => navigate({ to: "/login" }) },
    });
  };

  const renderLink = (link: SidebarLink) => {
    const isActive = link.exact
      ? location.pathname === link.path
      : location.pathname.startsWith(link.path);

    const item = (
      <Link
        to={link.path}
        key={link.path}
        /*
         * The router does its own active matching and sets aria-current from
         * it, so it has to be told about `exact` too -- otherwise it prefix-
         * matches and marks /admin current on every /admin/* page. The styling
         * below was already correct; this was two nav items telling a screen
         * reader they were both the current page.
         *
         * aria-current is deliberately not set here: <Link> owns it, and
         * passing undefined does not override what the router adds.
         */
        activeOptions={{ exact: Boolean(link.exact) }}
        // gap-0 when collapsed is load-bearing. The label stays mounted at
        // zero width so it can be clipped smoothly, but a gap still applies
        // between it and the icon -- so centring measured icon+gap+label and
        // put the icon 6px left of the pill it sits in.
        className={`relative flex items-center overflow-hidden rounded-2xl transition-[background-color,color,width] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
          railCollapsed
            ? "h-11 w-11 justify-center gap-0 px-0"
            : "h-11 w-full gap-3 px-4"
        } ${isActive ? "text-accent-600" : "text-ink-600 hover:text-ink-950"}`}
      >
        {isActive && (
          <motion.div
            // Keyed by collapse state on purpose. With one shared id,
            // collapsing made the indicator animate from a 270px pill to a
            // 44px square -- a shape morph nobody asked for. Two ids means
            // collapsing swaps it instantly while moving between links still
            // slides, which is what it is for. Also keyed by surface, so the
            // app and admin rails never try to animate into one another.
            layoutId={`${surface}-active-link-${railCollapsed ? "rail" : "wide"}`}
            className="absolute inset-0 rounded-2xl bg-accent-500/12"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        <Icon icon={link.icon} size={20} className="relative z-10 shrink-0" />
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
    // The extra wrapper is load-bearing: Tooltip renders an inline-flex
    // element, which shrink-wraps its child instead of filling the rail, so
    // the icons sat 17px left of the centre the toggle above them is on. This
    // re-centres them.
    return railCollapsed ? (
      <div key={link.path} className="flex justify-center">
        <Tooltip content={link.name}>{item}</Tooltip>
      </div>
    ) : (
      item
    );
  };

  return (
    <div
      /*
       * Two layouts in one element.
       *
       * From md up it is an in-flow rail whose width the collapse toggle
       * animates. Below md it is a fixed drawer sitting off the left edge
       * until opened -- a 288px rail against a 375px viewport left the content
       * column empty.
       *
       * `h-full` is deliberately md-only. A fixed element's containing block
       * is the viewport, so h-full there would be 100vh and, offset 8px down
       * by top-2, would hang 8px past the bottom; top-2/bottom-2 sizes it
       * correctly instead.
       *
       * The transition names `translate`, not `transform`. Tailwind v4
       * compiles translate-x-* to the standalone `translate` property -- the
       * same reason tokens.css animates `translate` in animate-enter -- so a
       * transition list naming `transform` covers a property that never
       * changes and the drawer snaps open with no animation at all.
       */
      /*
       * The collapse state is published as a data attribute so a caller's
       * children can respond to it -- the app's upsell card hides on the rail,
       * because a 72px column has nowhere to put a progress bar. A prop or a
       * render prop would work too, but this keeps the state owned here and
       * lets the child say what it wants in CSS.
       */
      data-rail={railCollapsed ? "collapsed" : "expanded"}
      className={`group/sidebar fixed top-2 bottom-2 left-2 z-50 flex w-72 min-w-72 flex-col justify-between gap-4 overflow-hidden rounded-panel border border-ink-200 bg-white p-2 transition-[width,min-width,translate] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:h-full md:translate-x-0 ${
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
            className={`flex items-center gap-2 overflow-hidden transition-[max-width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              railCollapsed ? "max-w-0" : "max-w-52"
            }`}
          >
            <img
              src="/purple_wordmark.png"
              alt="FormDrop"
              className="w-30 max-w-none"
            />
            {/* The marker PRD 4.6 asks for, so there is never ambiguity about
                which surface an action lands on. */}
            {badge && (
              <span className="shrink-0 rounded-full bg-accent-500/12 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-accent-700">
                {badge}
              </span>
            )}
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
            <Icon icon={Cancel01Icon} />
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
            <Icon icon={SidebarLeftIcon} />
          </button>
        </div>

        <nav className="mt-7 flex flex-col gap-y-1.5">
          {links.map(renderLink)}
        </nav>
      </div>

      {children}

      {secondaryLink && <div className="px-0">{renderLink(secondaryLink)}</div>}

      {/*
        Horizontal padding goes when the rail collapses, the way the header
        above already drops from px-5 to px-0.

        p-4 leaves 23px of content inside a 55px footer, and the avatar is
        32px -- so nine pixels of it were being cut off by the overflow-hidden
        that exists to truncate the name and email beside it. The avatar is
        centred when collapsed, so the padding was doing nothing but clipping.
      */}
      <div
        className={`w-full border-t border-ink-100 ${
          railCollapsed ? "px-0 py-4" : "p-4"
        }`}
      >
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
                <Icon icon={Logout01Icon} size={20} />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
