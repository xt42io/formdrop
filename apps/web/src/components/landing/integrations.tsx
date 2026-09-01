import { HugeiconsIcon } from "@hugeicons/react";
import {
  DiscordIcon,
  Mail01Icon,
  SlackIcon,
  TableIcon,
} from "@hugeicons/core-free-icons";

/**
 * Reference layout: label and headline on the left with a row of chunky badges
 * under them, and a divided grid panel on the right. The ground is the hero's
 * own line field rather than a flat tint, so the two read as one page.
 */
const BADGES = [
  { label: "Google Sheets", icon: TableIcon, tint: "bg-[#cdf0dd]" },
  { label: "Slack", icon: SlackIcon, tint: "bg-[#e5d9ff]" },
  { label: "Discord", icon: DiscordIcon, tint: "bg-[#cfe2ff]" },
  { label: "Email", icon: Mail01Icon, tint: "bg-accent-200" },
];

// The original checklist, as grid cells.
const CELLS = [
  {
    title: "Unlimited Forms",
    body: "Spin up a form per campaign, per page, per idea. There's no cap and no per-form pricing.",
    edges: "border-b md:border-r",
  },
  {
    title: "Unlimited Submissions",
    body: "Collect as many as your forms attract, on the free plan included.",
    edges: "border-b",
  },
  {
    title: "Real-time notifications",
    body: "Email, Slack and Discord fire the moment a submission arrives.",
    edges: "border-b md:border-r md:border-b-0",
  },
  {
    title: "Auto-sync to Google Sheets",
    body: "Every submission lands as a row, with headers written for you.",
    edges: "border-b md:border-b-0",
  },
  {
    title: "Powerful analytics and reporting",
    body: "Views, submissions and conversion per form, with weekly and monthly reports on Pro.",
    edges: "md:col-span-2 md:border-t",
  },
];

export function Integrations() {
  return (
    <section className="relative overflow-hidden px-6 py-24">
      {/* same line field as the hero */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-lines mask-[linear-gradient(to_bottom,transparent,#000_22%,#000_78%,transparent)]" />
        <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-sm font-medium text-ink-500">Integrations</p>

          <h2 className="mt-4 text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-ink-950">
            Connect with your favorite tools
          </h2>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-600">
            Streamline your workflow by connecting FormDrop to the tools you
            already use. Automatically sync submissions to Google Sheets or get
            notified in Slack and Discord.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {BADGES.map((badge) => (
              <li
                key={badge.label}
                className={`flex items-center gap-2 rounded-xl py-1.5 pr-3.5 pl-1.5 text-sm font-semibold text-ink-900 ${badge.tint}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/70">
                  <HugeiconsIcon icon={badge.icon} size={15} />
                </span>
                {badge.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-ink-200 bg-white/80 backdrop-blur-sm">
          <div className="grid md:grid-cols-2">
            {CELLS.map((cell) => (
              <div
                key={cell.title}
                className={`border-ink-200 p-6 ${cell.edges}`}
              >
                <h3 className="font-semibold text-ink-950">{cell.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  {cell.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
