import { useEffect, useState } from "react";
import { palette } from "@formdrop/ui";

/**
 * Design tokens, resolved to values Recharts can use.
 *
 * Recharts takes colours as strings on props -- `stroke`, `fill`,
 * `contentStyle` -- so a Tailwind class cannot reach them. That is why both
 * analytics pages had the brand violet and a handful of greys written out as
 * hex, which W4's acceptance forbids outright ("zero raw hex values outside
 * packages/ui tokens") and which meant the charts would not follow the palette
 * if it ever moved.
 *
 * The tokens are CSS custom properties on :root, so they can be read back at
 * runtime and handed to Recharts as strings. One source of truth, and the
 * charts change colour when the palette does.
 *
 * The fallbacks are only reached before the effect runs -- during SSR, where
 * there is no document. They come from packages/ui's palette rather than
 * being typed out, so they cannot go stale when the ramp moves: that module
 * is generated from tokens.css and a test fails if the two disagree.
 */
export interface ChartTheme {
  accent: string;
  grid: string;
  tick: string;
  surface: string;
  border: string;
}

const FALLBACK: ChartTheme = {
  accent: palette["accent-500"],
  grid: palette["ink-100"],
  tick: palette["ink-500"],
  surface: "white",
  border: palette["ink-200"],
};

const TOKENS: Record<keyof ChartTheme, string> = {
  accent: "--color-accent-500",
  grid: "--color-ink-100",
  tick: "--color-ink-500",
  surface: "--color-white",
  border: "--color-ink-200",
};

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);

    const read = (token: string, fallback: string) => {
      const value = styles.getPropertyValue(token).trim();
      return value || fallback;
    };

    setTheme({
      accent: read(TOKENS.accent, FALLBACK.accent),
      grid: read(TOKENS.grid, FALLBACK.grid),
      tick: read(TOKENS.tick, FALLBACK.tick),
      // White is not a token; the surface is plain white either way.
      surface: FALLBACK.surface,
      border: read(TOKENS.border, FALLBACK.border),
    });
  }, []);

  return theme;
}

/**
 * A period against the one before it.
 *
 * W4 4.5 asks analytics for a previous-period comparison. This derives one
 * from the series already on the page rather than from a second request: the
 * most recent `window` days against the `window` days before them.
 *
 * Returns null when there is not enough history to compare honestly -- a
 * "+100%" drawn from four days of data against zero is worse than no number.
 */
export interface PeriodComparison {
  current: number;
  previous: number;
  /** Percentage change, or null when the previous period was empty. */
  percent: number | null;
  direction: "up" | "down" | "flat";
}

export function comparePeriods(
  series: { submissions: number }[],
  window = 7,
): PeriodComparison | null {
  if (series.length < window * 2) return null;

  const sum = (points: { submissions: number }[]) =>
    points.reduce((total, point) => total + point.submissions, 0);

  const current = sum(series.slice(-window));
  const previous = sum(series.slice(-window * 2, -window));

  if (current === previous) {
    return { current, previous, percent: 0, direction: "flat" };
  }

  return {
    current,
    previous,
    // Growth from nothing has no percentage; the caller shows the count.
    percent: previous === 0 ? null : ((current - previous) / previous) * 100,
    direction: current > previous ? "up" : "down",
  };
}

/** The last `window` days, whether or not there is enough history to compare. */
export function sumRecent(
  series: { submissions: number }[],
  window = 7,
): number {
  return series.slice(-window).reduce((total, p) => total + p.submissions, 0);
}
