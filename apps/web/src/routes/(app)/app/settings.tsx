import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { PasswordSettings } from "@/components/settings/password-settings";
import { BillingSettings } from "@/components/settings/billing-settings";
import { ReportSettings } from "@/components/settings/report-settings";

type Tab = "profile" | "password" | "notifications" | "billing";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "password", label: "Password" },
  // The summary email tells people to turn it off in Settings, so the tab it
  // names has to exist.
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing" },
] as const;

export const Route = createFileRoute("/(app)/app/settings")({
  head: () => ({
    meta: [{ title: "Settings | FormDrop" }],
  }),
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => {
    const tab = (search.tab as string) || "profile";
    if (["profile", "password", "notifications", "billing"].includes(tab)) {
      return { tab: tab as Tab };
    }
    return { tab: "profile" };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { tab: activeTab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: session } = useSession();

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const res = await fetch("/api/user/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  /* The heading is rendered by both branches rather than only by the loaded
     one, so it does not appear late and shove the rest of the page down. */
  const header = (
    <div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
        Settings
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Your account, how you sign in, and your plan.
      </p>
    </div>
  );

  if (isSettingsLoading) {
    return (
      <div>
        {header}
        {/* Shaped like what replaces it -- a tab rule at the same height, then
            a panel -- so the page does not rearrange itself when data lands. */}
        <div className="mt-6 flex gap-8 border-b border-ink-200 pb-3">
          {[3.5, 4.5, 3.5].map((w, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-ink-100"
              style={{ width: `${w}rem` }}
            />
          ))}
        </div>
        <div className="mt-6 h-80 animate-pulse rounded-panel bg-ink-100" />
      </div>
    );
  }

  return (
    <div>
      {header}

      {/* Underline tabs rather than the 256px left rail this replaces. Three
          items did not need a quarter of the page to themselves, and the form
          detail screen already navigates this way -- the two tabbed surfaces
          in the dashboard now behave identically, down to the underline
          springing between labels instead of cutting. */}
      <nav
        aria-label="Settings sections"
        className="mt-6 flex gap-8 border-b border-ink-200"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              /* Deliberately not role="tab". These write the URL, so they are
                 navigation, and aria-current says so honestly. The tablist
                 role would promise a roving-tabindex arrow-key contract that
                 is not implemented -- announcing a pattern and then not
                 honouring it strands a screen reader worse than plain
                 buttons do. */
              aria-current={isActive ? "page" : undefined}
              onClick={() => navigate({ search: { tab: tab.id } })}
              className={`relative cursor-pointer px-1 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                isActive ? "text-accent-600" : "text-ink-600 hover:text-ink-950"
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="settings-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-500"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Keyed on the tab so switching remounts and re-runs the entrance. That
          entrance is the CSS utility, not a motion fade: tokens.css makes the
          case at length, but the short version is that anything starting at
          opacity 0 can strand the panel invisible if its frames never run. */}
      <div key={activeTab} className="animate-enter mt-6">
        {activeTab === "profile" && <ProfileSettings session={session} />}
        {activeTab === "password" && (
          <PasswordSettings hasPassword={settings?.hasPassword} />
        )}
        {activeTab === "notifications" && <ReportSettings />}
        {activeTab === "billing" && <BillingSettings settings={settings} />}
      </div>
    </div>
  );
}
