import {
  AnalyticsUpIcon,
  ArrowLeft01Icon,
  DashboardSquare01Icon,
  File01Icon,
  Settings02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import {
  DashboardSidebar,
  type SidebarLink,
} from "@/components/dashboard-sidebar";

/**
 * The admin surface's sidebar (PRD 4.6).
 *
 * The shell is DashboardSidebar, shared with the account dashboard, so this
 * screen stops being the one that looks like the old product. What is left
 * here is what actually differs: the links, the "Admin" marker, and a way
 * back.
 *
 * Dashboard is `exact` because every other admin route begins with /admin --
 * a prefix match lights it up on all five screens at once.
 */
const LINKS: SidebarLink[] = [
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

const BACK_TO_APP: SidebarLink = {
  name: "Back to app",
  path: "/app",
  icon: ArrowLeft01Icon,
};

export interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  return (
    <DashboardSidebar
      surface="admin"
      badge="Admin"
      links={LINKS}
      secondaryLink={BACK_TO_APP}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
