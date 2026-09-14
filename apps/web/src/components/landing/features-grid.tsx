import { motion, useReducedMotion } from "motion/react";
import { Icon } from "@formdrop/ui";
import { Discord, Gmail, Notion, Slack } from "@ridemountainpig/svgl-react";
import { AnalyticsVisual } from "./analytics-visual";
import { useCycle } from "./use-cycle";
import {
  CheckmarkCircle02Icon,
  Key01Icon,
  LockKeyIcon,
} from "@hugeicons/core-free-icons";

/**
 * Four quadrants in a single panel, divided by hairlines rather than being
 * separate cards: each cell carries a product visual on a soft ground, then its
 * heading and copy underneath.
 *
 * Borders are set per cell instead of with `divide-*` — on a two-column grid the
 * divide utilities follow DOM order and rule the wrong edges.
 *
 * Every brand mark here is the real logo, from svgl. The generic glyphs this
 * replaces were the same weight and colour as the interface icons beside them,
 * so "Slack" and "Discord" read as decoration rather than as the products a
 * reader is looking for.
 */
const CELLS = [
  {
    title: "Real-time Analytics",
    body: "Track form views, submissions, and conversion rates in real-time. Get insights into how your forms are performing.",
    edges: "border-b md:border-r",
    visual: <AnalyticsVisual />,
    interactive: true,
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
  const reduceMotion = useReducedMotion();

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading text-balance text-ink-950">
            Everything you need to handle forms
          </h2>
          <p className="section-lede mt-4 text-ink-600">
            Stop worrying about servers, spam, and database maintenance. We
            handle the messy part so you can focus on building.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-panel border border-ink-200 bg-ink-50/70">
          <div className="grid md:grid-cols-2">
            {CELLS.map((cell, i) => (
              <motion.div
                key={cell.title}
                className={`group border-ink-200 p-8 transition-colors hover:bg-white/60 sm:p-10 ${cell.edges}`}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.38,
                  delay: reduceMotion ? 0 : i * 0.07,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* The chart takes pointer and keyboard input, so it is not
                    hidden from assistive tech the way the other three are. */}
                <div
                  aria-hidden={cell.interactive ? undefined : "true"}
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
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A product surface, held flat on the ground of its cell — no drop shadow. */
function Float({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-ink-200 bg-white ${className}`}>
      {children}
    </div>
  );
}

/** A brand mark on its own tile, sized so every logo reads at the same weight. */
function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ink-200/70 bg-white [&>svg]:h-4 [&>svg]:w-4">
      {children}
    </span>
  );
}

/**
 * Notifications arriving, one channel at a time and then round again.
 *
 * The heading says "instant", so the cell shows delivery happening rather
 * than three settled rows. The lit row lifts and takes an accent ring; the
 * other two stay exactly as they were.
 */
function AlertsVisual() {
  const reduceMotion = useReducedMotion();
  const live = useCycle(3, 1600, !reduceMotion);

  const rows = [
    { mark: <Gmail />, label: "you@company.com", meta: "Email", offset: "" },
    { mark: <Slack />, label: "#leads", meta: "Slack", offset: "ml-6" },
    {
      mark: <Discord />,
      label: "#submissions",
      meta: "Discord",
      offset: "ml-3",
    },
  ];

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {rows.map((row, i) => (
        <motion.div
          key={row.meta}
          className={row.offset}
          initial={reduceMotion ? false : { opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{
            duration: reduceMotion ? 0 : 0.4,
            delay: reduceMotion ? 0 : 0.15 + i * 0.12,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: live === i ? -3 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <Float
              className={`flex items-center gap-2.5 px-3.5 py-2.5 transition-[background-color,border-color] duration-500 group-hover:translate-x-1 ${
                live === i ? "border-accent-500 bg-accent-100" : ""
              }`}
            >
              <Mark>{row.mark}</Mark>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-900">
                {row.label}
              </span>
              <span className="text-[10px] text-ink-500">{row.meta}</span>
            </Float>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * The submission reaching each destination in turn, then starting over.
 *
 * A pulse runs down the connector and the target it lands on lifts and
 * lights, so the row below reads as somewhere submissions go rather than as
 * four logos sitting in a line.
 */
function IntegrationsVisual() {
  const reduceMotion = useReducedMotion();
  const live = useCycle(4, 1500, !reduceMotion);

  const targets = [
    { name: "Google Sheets", node: <img src="/google-sheet.svg" alt="" /> },
    // svgl has no Airtable mark; this is the real logo, already in public/.
    { name: "Airtable", node: <img src="/airtable.svg" alt="" /> },
    { name: "Slack", node: <Slack /> },
    { name: "Notion", node: <Notion /> },
  ];

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <Float className="flex items-center gap-2.5 px-4 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-50">
          <img src="/purple_icon.svg" alt="" className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs font-semibold text-ink-900">
          New submission
        </span>
      </Float>

      {/* The connector fills downward on entry, then carries a pulse each time
          a submission is dispatched. */}
      <motion.div
        className="relative w-px origin-top overflow-hidden bg-ink-300"
        style={{ height: 16 }}
        initial={reduceMotion ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: reduceMotion ? 0 : 0.35, delay: 0.2 }}
      >
        {!reduceMotion && (
          <motion.span
            key={live}
            className="absolute inset-x-0 h-2 bg-accent-500"
            initial={{ top: "-50%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 0.45, ease: "easeIn" }}
          />
        )}
      </motion.div>

      <div className="flex gap-2">
        {targets.map((target, i) => (
          <motion.div
            key={target.name}
            title={target.name}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{
              duration: reduceMotion ? 0 : 0.35,
              delay: reduceMotion ? 0 : 0.35 + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={reduceMotion ? undefined : { y: -4 }}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: live === i ? -5 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              <Float
                className={`p-2.5 transition-[background-color,border-color] duration-500 ${
                  live === i ? "border-accent-500 bg-accent-100" : ""
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg [&>img]:h-4.5 [&>img]:w-4.5 [&>svg]:h-4.5 [&>svg]:w-4.5">
                  {target.node}
                </span>
              </Float>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * The three checks running in sequence, then again.
 *
 * Spam filtering, the domain allowlist and key rotation are things that
 * happen on every submission, so the cell runs them rather than listing them.
 * The row being checked lights; the other two hold their resting state.
 */
function SecurityVisual() {
  const reduceMotion = useReducedMotion();
  const live = useCycle(3, 1500, !reduceMotion);

  const rows = [
    {
      key: "spam",
      offset: "",
      icon: (
        <Icon
          icon={CheckmarkCircle02Icon}
          size={16}
          className="shrink-0 text-tint-green-ink"
        />
      ),
      body: (
        <>
          <span className="text-xs font-semibold text-ink-900">
            Spam Check Passed
          </span>
          <span className="ml-auto rounded-full bg-tint-green px-2 py-0.5 text-[10px] font-semibold text-tint-green-ink">
            Score: 98/100
          </span>
        </>
      ),
    },
    {
      key: "domain",
      offset: "ml-5",
      icon: (
        <Icon icon={LockKeyIcon} size={16} className="shrink-0 text-ink-500" />
      ),
      body: (
        <>
          <span className="text-xs font-medium text-ink-900">yoursite.com</span>
          <span className="ml-auto rounded-full bg-tint-blue px-2 py-0.5 text-[10px] font-semibold text-tint-blue-ink">
            Allowed
          </span>
        </>
      ),
    },
    {
      key: "key",
      offset: "ml-2",
      icon: (
        <Icon icon={Key01Icon} size={16} className="shrink-0 text-ink-500" />
      ),
      body: (
        <>
          <span className="font-mono text-[11px] text-ink-700">
            fd_sk_••••4f9c
          </span>
          <span className="ml-auto rounded-full bg-tint-amber px-2 py-0.5 text-[10px] font-semibold text-tint-amber-ink">
            Rotated
          </span>
        </>
      ),
    },
  ];

  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5">
      {rows.map((row, i) => (
        <motion.div
          key={row.key}
          className={row.offset}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{
            duration: reduceMotion ? 0 : 0.4,
            delay: reduceMotion ? 0 : 0.15 + i * 0.12,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { x: live === i ? 4 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <Float
              className={`flex items-center gap-2.5 px-3.5 py-3 transition-[background-color,border-color] duration-500 ${
                live === i ? "border-accent-500 bg-accent-100" : ""
              }`}
            >
              {row.icon}
              {row.body}
            </Float>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
