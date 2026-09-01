import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  LockKeyIcon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons";
import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { PasswordSettings } from "@/components/settings/password-settings";
import { BillingSettings } from "@/components/settings/billing-settings";

type Tab = "profile" | "password" | "billing";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [{ title: "Settings | FormDrop" }],
  }),
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => {
    const tab = (search.tab as string) || "profile";
    if (["profile", "password", "billing"].includes(tab)) {
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

  const setActiveTab = (tab: Tab) => {
    navigate({ search: { tab } });
  };

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const res = await fetch("/api/user/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "password", label: "Password", icon: LockKeyIcon },
    { id: "billing", label: "Billing", icon: CreditCardIcon },
  ] as const;

  if (isSettingsLoading) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-8"></div>
        <div className="flex gap-8">
          <div className="w-64 h-64 bg-gray-200 rounded-3xl"></div>
          <div className="flex-1 h-96 bg-gray-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-3xl border border-gray-200 p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="active-settings-tab"
                    className="absolute inset-0 bg-accent rounded-2xl shadow-md shadow-accent/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <HugeiconsIcon icon={tab.icon} size={20} />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "profile" && <ProfileSettings session={session} />}

              {activeTab === "password" && (
                <PasswordSettings hasPassword={settings?.hasPassword} />
              )}

              {activeTab === "billing" && (
                <BillingSettings settings={settings} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
