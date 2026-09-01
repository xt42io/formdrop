import {
  AddToListIcon,
  AnalyticsUpIcon,
  Key01Icon,
  Logout01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useState } from "react";
import { UpgradeModal } from "./upgrade-modal";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { motion } from "motion/react";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { data: subscriptionData, isPending: isSubscriptionPending } = useQuery(
    {
      queryKey: ["subscription"],
      queryFn: () => appClient.subscription.get(),
    },
  );

  const isPro =
    subscriptionData &&
    "subscription" in subscriptionData &&
    subscriptionData.subscription?.status === "active";

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/login" });
        },
      },
    });
  };

  const links = [
    { name: "Forms", path: "/app/forms", icon: AddToListIcon },
    { name: "Analytics", path: "/app/analytics", icon: AnalyticsUpIcon },
    { name: "API Keys", path: "/app/api-keys", icon: Key01Icon },
    { name: "Settings", path: "/app/settings", icon: Settings02Icon },
  ];

  return (
    <div className="bg-white w-72 min-w-72 max-w-72 p-2 border border-gray-200 rounded-2xl flex flex-col gap-4 justify-between h-full">
      <div className="flex-1 min-w-0">
        <div className="px-5 pt-3">
          <img
            src="/purple_wordmark.png"
            alt="FormDrop Logo"
            className="w-30"
          />
        </div>
        <div className="flex flex-col gap-y-3 mt-7">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                to={link.path}
                key={link.path}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-4xl transition-colors ${
                  isActive ? "text-accent" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-link"
                    className="absolute inset-0 bg-accent/15 rounded-4xl"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                <HugeiconsIcon
                  icon={link.icon}
                  size={20}
                  className="relative z-10"
                  color={isActive ? "#6f63e4" : undefined}
                />
                <span className={`text-sm font-medium relative z-10`}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      {!isSubscriptionPending && !isPro && (
        <div className="px-2">
          <div className="bg-linear-to-br from-accent/5 to-accent/20 p-4 rounded-xl border border-accent/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/15 transition-colors duration-500"></div>

            <div className="flex items-center gap-2 mb-2 relative z-10">
              <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
                <Sparkles size={14} className="fill-accent/20" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">
                Upgrade to Pro
              </h3>
            </div>

            <p className="text-xs text-gray-500 mb-3 relative z-10 leading-relaxed">
              Unlock powerful integrations and advanced analytics.
            </p>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-medium py-3 rounded-3xl transition-all cursor-pointer shadow-sm shadow-accent/20 hover:shadow-accent/30 active:scale-[0.98] relative z-10"
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
      <div className="p-4 border-t border-gray-100 w-full">
        {isPending ? (
          <div className="flex items-center gap-3 w-full">
            <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ) : session?.user ? (
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium shrink-0">
                {session.user.name?.charAt(0).toUpperCase() ||
                  session.user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {session.user.name}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {session.user.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Sign out"
            >
              <HugeiconsIcon icon={Logout01Icon} size={20} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
