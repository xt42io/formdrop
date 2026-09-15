/**
 * The window a summary email covers.
 *
 * UTC `YYYY-MM-DD` throughout, because that is the key `usagePeriod` writes
 * usage rows under. Only ever a *completed* period: a week-to-date summary
 * would be a different thing every time it ran.
 */

export type ReportFrequency = "weekly" | "monthly";

export interface ReportPeriod {
  /** First day covered, inclusive. */
  start: string;
  /** Last day covered, inclusive. */
  end: string;
  /** What the email calls it, e.g. "1–7 September 2026". */
  label: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_MS = 86_400_000;

const key = (d: Date) => d.toISOString().slice(0, 10);

/** Midnight UTC on the day containing `at`, so arithmetic is whole days. */
function startOfDay(at: Date): Date {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
  );
}

/**
 * Monday of the week containing `at`.
 *
 * getUTCDay() puts Sunday at 0, so Sunday has to walk back six days rather
 * than none — the off-by-one that makes a Sunday report cover the week that
 * has not finished yet.
 */
function startOfWeek(at: Date): Date {
  const day = startOfDay(at);
  const weekday = day.getUTCDay();
  const backToMonday = weekday === 0 ? 6 : weekday - 1;
  return new Date(day.getTime() - backToMonday * DAY_MS);
}

function weekLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCFullYear() === end.getUTCFullYear();

  const endPart = `${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;

  // Repeating the month on both sides of a week that never leaves it reads as
  // a mistake, so it is only named twice when the week actually crosses one.
  return sameMonth
    ? `${start.getUTCDate()}–${endPart}`
    : `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} – ${endPart}`;
}

/**
 * The most recent period that has finished.
 *
 * Weekly runs Monday to Sunday and reports the week before the current one.
 * Monthly reports the previous calendar month.
 */
export function lastCompletedPeriod(
  frequency: ReportFrequency,
  now: Date = new Date(),
): ReportPeriod {
  if (frequency === "weekly") {
    const thisMonday = startOfWeek(now);
    const start = new Date(thisMonday.getTime() - 7 * DAY_MS);
    const end = new Date(thisMonday.getTime() - DAY_MS);
    return { start: key(start), end: key(end), label: weekLabel(start, end) };
  }

  const firstOfThisMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const start = new Date(
    Date.UTC(
      firstOfThisMonth.getUTCFullYear(),
      firstOfThisMonth.getUTCMonth() - 1,
      1,
    ),
  );
  const end = new Date(firstOfThisMonth.getTime() - DAY_MS);

  return {
    start: key(start),
    end: key(end),
    label: `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
  };
}

/**
 * The period immediately before `period`, for the comparison figure.
 *
 * `lastCompletedPeriod` returns the period before the one containing the date
 * it is handed, and a period's own start day is always inside it.
 */
export function previousPeriod(
  frequency: ReportFrequency,
  period: ReportPeriod,
): ReportPeriod {
  return lastCompletedPeriod(frequency, new Date(`${period.start}T12:00:00Z`));
}

/**
 * Change against the previous period, rounded, or null when there is no
 * baseline -- reporting a first week as 0% would be a claim rather than an
 * absence, the same rule the dashboard's comparison follows.
 */
export function changePercent(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
