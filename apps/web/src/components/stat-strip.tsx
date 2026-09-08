import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDownRight01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import type { PeriodComparison } from "@/lib/chart-theme";

/**
 * The row of figures at the top of a dashboard screen.
 *
 * W4's reading of the references (section 4.1) is "oversized, tight-tracked
 * type as the primary visual device" and "one saturated accent doing a lot of
 * work against a near-neutral ground". That is what this is: the numbers are
 * the largest thing on the page, and exactly one tile carries the accent so it
 * reads as the headline rather than as four competing colours.
 *
 * Figures are tabular-nums so they do not jitter when they update, and the
 * label sits above the number -- reading order is "submissions: 1,811", not a
 * number you have to look under to identify.
 */
export interface Stat {
  label: string;
  value: string | number;
  /** A short qualifier under the figure, e.g. "across 4 forms". */
  detail?: string;
  /** Renders in the accent. Use on one tile at most. */
  feature?: boolean;
  icon?: ReactNode;
  /** This period against the one before it (W4 4.5). */
  delta?: PeriodComparison | null;
}

/**
 * The change against the previous period.
 *
 * Up is not automatically good and down is not automatically bad, but for
 * submission counts it is, so the colours follow direction. A period that grew
 * from zero has no percentage to show, so it shows the count instead of a
 * misleading infinity.
 */
function Delta({
  comparison,
  feature,
}: {
  comparison: PeriodComparison;
  feature?: boolean;
}) {
  if (comparison.direction === "flat") {
    return (
      <span className={`text-xs ${feature ? "text-white/70" : "text-ink-500"}`}>
        No change
      </span>
    );
  }

  const up = comparison.direction === "up";
  const label =
    comparison.percent === null
      ? `+${comparison.current.toLocaleString()}`
      : `${up ? "+" : ""}${comparison.percent.toFixed(0)}%`;

  const tone = feature
    ? "text-white/90"
    : up
      ? "text-tint-green-ink"
      : "text-tint-rose-ink";

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${tone}`}
    >
      <HugeiconsIcon
        icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon}
        size={13}
      />
      {label}
    </span>
  );
}

function Tile({ stat }: { stat: Stat }) {
  const value =
    typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value;

  if (stat.feature) {
    return (
      <div className="relative overflow-hidden rounded-panel bg-accent-600 p-5">
        {/* Atmosphere, not decoration: one soft bloom rather than a gradient
            across the whole tile, so the figure stays the brightest thing. */}
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-white/70 uppercase">
            {stat.icon}
            {stat.label}
          </div>
          <div className="mt-2 text-[2rem] leading-none font-semibold tracking-[-0.035em] text-white tabular-nums">
            {value}
          </div>
          {(stat.detail || stat.delta) && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-white/70">
              {stat.delta && <Delta comparison={stat.delta} feature />}
              {stat.detail}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-panel border border-ink-200 bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-500 uppercase">
        {stat.icon}
        {stat.label}
      </div>
      <div className="mt-2 text-[2rem] leading-none font-semibold tracking-[-0.035em] text-ink-950 tabular-nums">
        {value}
      </div>
      {(stat.detail || stat.delta) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-500">
          {stat.delta && <Delta comparison={stat.delta} />}
          {stat.detail}
        </div>
      )}
    </div>
  );
}

export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div
      className={`animate-enter mt-6 grid gap-3 ${
        stats.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
      }`}
    >
      {stats.map((stat) => (
        <Tile key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
