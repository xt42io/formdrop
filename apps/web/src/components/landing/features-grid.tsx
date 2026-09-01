import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  DiscordIcon,
  Key01Icon,
  LockKeyIcon,
  Mail01Icon,
  SlackIcon,
  TableIcon,
} from "@hugeicons/core-free-icons";

/**
 * Four quadrants in a single panel, divided by hairlines rather than being
 * separate cards: each cell carries a product visual on a soft ground, then its
 * heading and copy underneath.
 *
 * Borders are set per cell instead of with `divide-*` — on a two-column grid the
 * divide utilities follow DOM order and rule the wrong edges.
 */
const CELLS = [
  {
    title: "Real-time Analytics",
    body: "Track form views, submissions, and conversion rates in real-time. Get insights into how your forms are performing.",
    edges: "border-b md:border-r",
    visual: <AnalyticsVisual />,
  },
  {
    title: "Instant Alerts",
    body: "Get notified immediately via Email, Slack, or Discord.",
    edges: "border-b",
    visual: <AlertsVisual />,
  },
  {
    title: "Integrations",
    body: "Connect to Google Sheets, Webhooks, and more.",
    edges: "border-b md:border-r md:border-b-0",
    visual: <IntegrationsVisual />,
  },
  {
    title: "Spam Protection & Security",
    body: "Built-in spam filtering keeps your inbox clean. Secure your forms with rolling API keys and allowed domains.",
    edges: "",
    visual: <SecurityVisual />,
  },
];

export function FeaturesGrid() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(1.55rem,2.6vw,1.95rem)] leading-[1.25] font-semibold tracking-[-0.025em] text-ink-950">
            Everything you need to handle forms
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
            Stop worrying about servers, spam, and database maintenance. We
            handle the messy part so you can focus on building.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-ink-200 bg-ink-50/70">
          <div className="grid md:grid-cols-2">
            {CELLS.map((cell) => (
              <div
                key={cell.title}
                className={`border-ink-200 p-8 sm:p-10 ${cell.edges}`}
              >
                <div
                  aria-hidden="true"
                  className="flex h-60 items-center justify-center overflow-hidden"
                >
                  {cell.visual}
                </div>

                <h3 className="mt-8 text-lg font-semibold text-ink-950">
                  {cell.title}
                </h3>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-600">
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

/** A floating surface, the way the reference lifts each mock off the ground. */
function Float({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-ink-200/70 bg-white shadow-lift ${className}`}
    >
      {children}
    </div>
  );
}

function AnalyticsVisual() {
  // 12 points, plotted into a 260x90 box; the path is generated so the curve
  // and the fill can't drift apart.
  const points = [22, 27, 25, 34, 33, 43, 47, 46, 57, 63, 71, 86];
  const w = 260;
  const h = 90;
  const inset = 8;
  const step = (w - inset * 2) / (points.length - 1);
  const coords = points.map(
    (p, i) => [inset + i * step, h - (p / 100) * h] as const,
  );

  const line = coords
    .map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = coords[i - 1];
      const cx = px + step / 2;
      return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
    })
    .join(" ");

  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <Float className="w-full max-w-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-400">Submissions</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-[-0.02em] text-ink-950">
            1,204
          </p>
        </div>
        <span className="rounded-lg bg-accent-50 px-2 py-1 text-xs font-semibold text-accent-700">
          +38%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${w} ${h + 8}`}
        className="mt-4 w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id="fd-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baselines */}
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1="0"
            x2={w}
            y1={t * h}
            y2={t * h}
            stroke="var(--color-ink-100)"
            strokeWidth="1"
          />
        ))}

        <path
          d={`${line} L ${w - inset} ${h} L ${inset} ${h} Z`}
          fill="url(#fd-area)"
        />
        <path
          d={line}
          stroke="var(--color-accent-500)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* the live point */}
        <circle cx={lastX} cy={lastY} r="8" fill="var(--color-accent-500)" opacity="0.18" />
        <circle
          cx={lastX}
          cy={lastY}
          r="3.5"
          fill="var(--color-accent-500)"
          stroke="#fff"
          strokeWidth="2"
        />
      </svg>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
        <span className="text-[11px] text-ink-400">Last 30 days</span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-600">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          Live
        </span>
      </div>
    </Float>
  );
}

function AlertsVisual() {
  const rows = [
    { icon: Mail01Icon, label: "you@company.com", meta: "Email" },
    { icon: SlackIcon, label: "#leads", meta: "Slack" },
    { icon: DiscordIcon, label: "#submissions", meta: "Discord" },
  ];

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {rows.map((row, i) => (
        <Float
          key={row.meta}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 ${
            i === 1 ? "ml-6" : i === 2 ? "ml-3" : ""
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
            <HugeiconsIcon icon={row.icon} size={14} />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-900">
            {row.label}
          </span>
          <span className="text-[10px] text-ink-400">{row.meta}</span>
        </Float>
      ))}
    </div>
  );
}

function IntegrationsVisual() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <Float className="flex items-center gap-2.5 px-4 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-950">
          <img src="/white_icon.svg" alt="" className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-semibold text-ink-900">
          New submission
        </span>
      </Float>

      <div className="h-4 w-px bg-ink-300" />

      <div className="flex gap-2">
        {[
          { image: "/google-sheet.svg", tint: "bg-[#e2f4ea]" },
          { image: "/airtable.svg", tint: "bg-[#ffeac0]" },
          { icon: SlackIcon, tint: "bg-[#f3ebff] text-[#5b3ba8]" },
          { icon: TableIcon, tint: "bg-ink-100 text-ink-700" },
        ].map((node, i) => (
          <Float key={i} className="p-2.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${node.tint}`}
            >
              {node.image ? (
                <img src={node.image} alt="" className="h-4 w-4" />
              ) : (
                <HugeiconsIcon icon={node.icon!} size={16} />
              )}
            </span>
          </Float>
        ))}
      </div>
    </div>
  );
}

function SecurityVisual() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5">
      <Float className="flex items-center gap-2.5 px-3.5 py-3">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={16}
          className="shrink-0 text-accent-600"
        />
        <span className="text-xs font-semibold text-ink-900">
          Spam Check Passed
        </span>
        <span className="ml-auto text-[10px] text-ink-400">Score: 98/100</span>
      </Float>

      <Float className="ml-5 flex items-center gap-2.5 px-3.5 py-3">
        <HugeiconsIcon
          icon={LockKeyIcon}
          size={16}
          className="shrink-0 text-ink-500"
        />
        <span className="text-xs font-medium text-ink-900">
          yoursite.com
        </span>
        <span className="ml-auto text-[10px] text-ink-400">Allowed</span>
      </Float>

      <Float className="ml-2 flex items-center gap-2.5 px-3.5 py-3">
        <HugeiconsIcon
          icon={Key01Icon}
          size={16}
          className="shrink-0 text-ink-500"
        />
        <span className="font-mono text-[11px] text-ink-700">
          fd_sk_••••4f9c
        </span>
        <span className="ml-auto text-[10px] text-ink-400">Rotated</span>
      </Float>
    </div>
  );
}
