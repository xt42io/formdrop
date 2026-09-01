import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BookOpen01Icon,
  CodeIcon,
  RocketIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

const sidebarItems = [
  {
    title: "Overview",
    items: [
      { label: "Introduction", href: "/docs", icon: BookOpen01Icon, exact: true },
      { label: "Getting Started", href: "/docs/getting-started", icon: RocketIcon },
    ],
  },
  {
    title: "Features",
    items: [
      { label: "Forms", href: "/docs/forms", icon: CodeIcon },
      { label: "Integrations", href: "/docs/integrations", icon: Settings02Icon },
    ],
  },
  {
    title: "Developers",
    items: [{ label: "API Reference", href: "/docs/api", icon: CodeIcon }],
  },
];

export function DocsSidebar() {
  return (
    <aside className="w-64 shrink-0 hidden md:block sticky top-24 self-start">
      <nav className="space-y-8">
        {sidebarItems.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    activeOptions={{ exact: item.exact }}
                    activeProps={{
                      className: "bg-accent/15 text-accent font-medium",
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200/50 hover:text-gray-900 transition-all"
                  >
                    <HugeiconsIcon icon={item.icon} size={16} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
