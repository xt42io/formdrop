import { Link } from "@tanstack/react-router";
import { Icon } from "@formdrop/ui";
import { CodeIcon, RocketIcon, SparklesIcon } from "@hugeicons/core-free-icons";

/**
 * Icons sit on the section headings rather than on every item, so the item list
 * reads as a plain outline and the active row is the only thing carrying weight.
 */
const sidebarItems = [
  {
    title: "Get Started",
    icon: RocketIcon,
    items: [
      { label: "Introduction", href: "/docs", exact: true },
      { label: "Getting Started", href: "/docs/getting-started" },
    ],
  },
  {
    title: "Core Concepts",
    icon: SparklesIcon,
    items: [
      { label: "Forms", href: "/docs/forms" },
      { label: "Integrations", href: "/docs/integrations" },
    ],
  },
  {
    title: "Developers",
    icon: CodeIcon,
    items: [{ label: "API Reference", href: "/docs/api" }],
  },
];

export function DocsSidebar() {
  return (
    <aside className="sticky top-24 hidden w-56 shrink-0 self-start md:block">
      <nav className="flex flex-col gap-7">
        {sidebarItems.map((section) => (
          <div key={section.title}>
            <h2 className="mb-2 flex items-center gap-2 px-3 text-[13px] font-semibold text-ink-900">
              <Icon icon={section.icon} size={15} className="text-ink-400" />
              {section.title}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    activeOptions={{ exact: item.exact }}
                    activeProps={{
                      className: "bg-accent-100 text-accent-800 font-semibold",
                    }}
                    className="block rounded-lg px-3 py-1.5 text-sm text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
                  >
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
