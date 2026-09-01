import {
  DashboardSquare01Icon,
  UserGroupIcon,
  Logout01Icon,
  ArrowLeft01Icon,
  File01Icon,
  AnalyticsUpIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useSession, signOut } from "@/lib/auth-client";
import { motion } from "motion/react";

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSession();

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
    {
      name: "Dashboard",
      path: "/admin",
      icon: DashboardSquare01Icon,
      exact: true,
    },
    { name: "Users", path: "/admin/users", icon: UserGroupIcon },
    { name: "Forms", path: "/admin/forms", icon: File01Icon },
    { name: "Submissions", path: "/admin/submissions", icon: AnalyticsUpIcon },
    { name: "Settings", path: "/admin/settings", icon: Settings02Icon },
  ];

  return (
    <div className="bg-white w-72 min-w-72 max-w-72 p-2 border border-gray-200 rounded-2xl flex flex-col gap-4 justify-between h-full">
      <div className="flex-1 min-w-0">
        <div className="px-5 pt-3 flex items-center gap-2">
          <img
            src="/purple_wordmark.png"
            alt="FormDrop Logo"
            className="w-24"
          />
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <div className="flex flex-col gap-y-3 mt-7">
          {links.map((link) => {
            const isActive = link.exact
              ? location.pathname === link.path
              : location.pathname.startsWith(link.path);

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
                    layoutId="admin-sidebar-active-link"
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

      <div className="flex flex-col gap-2">
        <Link
          to="/app"
          className="flex items-center gap-3 px-4 py-3 rounded-4xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
          <span className="text-sm font-medium">Back to App</span>
        </Link>

        <div className="border-t border-gray-100 pt-4 px-2 pb-2">
          <div className="flex items-center gap-3 px-2 mb-4">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                {session?.user?.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={Logout01Icon} size={18} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
