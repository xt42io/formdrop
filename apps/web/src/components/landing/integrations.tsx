import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  DiscordIcon,
  Mail01Icon,
  SlackIcon,
  TableIcon,
} from "@hugeicons/core-free-icons";

const CHECKLIST = [
  "Unlimited Forms",
  "Unlimited Submissions",
  "Real-time notifications via Email, Slack & Discord",
  "Auto-sync to Google Sheets",
  "Powerful analytics and reporting",
];

/**
 * The destinations, and the connector each one hangs off. Coordinates are in
 * the diagram's 100x100 space: the SVG is scaled with preserveAspectRatio
 * "none", so an x of 14 is 14% across the panel and the HTML chips can be
 * positioned with the same numbers.
 */
const NODES = [
  {
    name: "Google Sheets",
    icon: TableIcon,
    tint: "bg-[#cdf0dd] text-[#1f6b45]",
    x: 12,
    path: "M 50 26 C 50 52 12 54 12 72",
    delay: "0s",
  },
  {
    name: "Slack",
    icon: SlackIcon,
    tint: "bg-[#e5d9ff] text-[#5b3ba8]",
    x: 37.3,
    path: "M 50 26 C 50 52 37.3 54 37.3 72",
    delay: "0.75s",
  },
  {
    name: "Discord",
    icon: DiscordIcon,
    tint: "bg-[#cfe2ff] text-[#2b4c9b]",
    x: 62.7,
    path: "M 50 26 C 50 52 62.7 54 62.7 72",
    delay: "1.5s",
  },
  {
    name: "Email",
    icon: Mail01Icon,
    tint: "bg-accent-200 text-accent-700",
    x: 88,
    path: "M 50 26 C 50 52 88 54 88 72",
    delay: "2.25s",
  },
];

export function Integrations() {
  return (
    <section className="relative overflow-hidden px-6 py-24">
      {/* the hero's own ground */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-lines mask-[linear-gradient(to_bottom,transparent,#000_22%,#000_78%,transparent)]" />
        <div className="absolute inset-0 bg-grain opacity-[0.02] mix-blend-multiply" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-ink-950">
            Connect FormDrop with all your favorite tools
          </h2>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-600">
            Streamline your workflow by connecting FormDrop to the tools you
            already use. Automatically sync submissions to Google Sheets or get
            notified in Slack and Discord.
          </p>

          <ul className="mt-8 flex flex-col gap-3 border-t border-ink-100 pt-7">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={17}
                  className="mt-0.5 shrink-0 text-accent-600"
                />
                <span className="text-ink-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <FanOut />
      </div>
    </section>
  );
}

/**
 * One submission fanning out to every destination. Each connector carries a
 * dash travelling from the hub outwards, staggered so the four don't pulse in
 * unison.
 */
function FanOut() {
  return (
    <div className="rounded-[1.75rem] border border-ink-200 bg-white/80 p-6 backdrop-blur-sm">
      <div className="relative h-[19rem]">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          fill="none"
        >
          {NODES.map((node) => (
            <g key={node.name}>
              {/* the connector itself, so the diagram holds without motion */}
              <path
                d={node.path}
                stroke="var(--color-ink-200)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              {/* the submission travelling down it */}
              <path
                d={node.path}
                stroke="var(--color-accent-500)"
                strokeWidth="2.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={100}
                strokeDasharray="6 94"
                style={{ animationDelay: node.delay }}
                className="animate-trace"
              />
            </g>
          ))}
        </svg>

        {/* the hub */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-2xl border border-ink-200 bg-white py-2.5 pr-4 pl-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-50">
              <img src="/purple_icon.svg" alt="" className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold whitespace-nowrap text-ink-950">
              New submission
            </span>
          </div>
        </div>

        {/* the destinations */}
        {NODES.map((node) => (
          <div
            key={node.name}
            style={{ left: `${node.x}%` }}
            className="absolute bottom-0 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-2">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-ink-200/70 shadow-lift ${node.tint}`}
              >
                <HugeiconsIcon icon={node.icon} size={20} />
              </span>
              <span className="max-w-16 text-center text-[11px] leading-tight font-medium text-ink-600">
                {node.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
