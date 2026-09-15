import { db } from "@formdrop/db";
import { emailDeliveries, forms, usage, user } from "@formdrop/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

/** The template name every summary send is logged under. */
export const REPORT_TEMPLATE = "report";

/**
 * Accounts that should get a summary for a period and have not had one.
 *
 * Idempotency comes from `email_deliveries` rather than a column of its own:
 * every send is already logged there with the account and the template, so
 * the existing table can answer it, and keeps answering it across a restart.
 *
 * `attemptCap` stops a permanently undeliverable address being retried on
 * every tick, while still allowing a transient failure another go.
 */
export async function findAccountsDueForReport(input: {
  frequency: "weekly" | "monthly";
  /** Anything logged at or after this instant counts as covering the period. */
  since: Date;
  attemptCap: number;
  limit: number;
}) {
  const attempts = db
    .select({
      userId: emailDeliveries.userId,
      sent: sql<number>`count(*) filter (where ${emailDeliveries.status} = 'sent')::int`.as(
        "sent",
      ),
      tries: sql<number>`count(*)::int`.as("tries"),
    })
    .from(emailDeliveries)
    .where(
      and(
        eq(emailDeliveries.template, REPORT_TEMPLATE),
        gte(emailDeliveries.createdAt, input.since),
      ),
    )
    .groupBy(emailDeliveries.userId)
    .as("attempts");

  return db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .leftJoin(attempts, eq(attempts.userId, user.id))
    .where(
      and(
        eq(user.reportFrequency, input.frequency),
        // A banned account does not get mail.
        sql`coalesce(${user.banned}, false) = false`,
        // Never twice, and never past the cap.
        sql`coalesce(${attempts.sent}, 0) = 0`,
        sql`coalesce(${attempts.tries}, 0) < ${input.attemptCap}`,
      ),
    )
    .limit(input.limit);
}

/**
 * What one account collected over a date range.
 *
 * Read off `usage` rather than counted from `submissions`: one row per form
 * per day keeps the aggregate small, and deleting submissions -- which people
 * do routinely -- does not rewrite history that has already been reported.
 */
export async function reportStatsForUser(input: {
  userId: string;
  start: string;
  end: string;
  topFormLimit: number;
}) {
  const rows = await db
    .select({
      formId: usage.formId,
      name: forms.name,
      submissions: sql<number>`coalesce(sum(${usage.count}), 0)::int`,
    })
    .from(usage)
    .innerJoin(forms, eq(forms.id, usage.formId))
    .where(
      and(
        eq(usage.userId, input.userId),
        gte(usage.period, input.start),
        lte(usage.period, input.end),
      ),
    )
    .groupBy(usage.formId, forms.name)
    .orderBy(desc(sql`sum(${usage.count})`));

  return {
    submissions: rows.reduce((total, row) => total + row.submissions, 0),
    topForms: rows
      .slice(0, input.topFormLimit)
      .map((row) => ({ name: row.name, submissions: row.submissions })),
  };
}

/** The total alone, for the previous period's comparison figure. */
export async function submissionsInRange(input: {
  userId: string;
  start: string;
  end: string;
}) {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${usage.count}), 0)::int` })
    .from(usage)
    .where(
      and(
        eq(usage.userId, input.userId),
        gte(usage.period, input.start),
        lte(usage.period, input.end),
      ),
    );

  return row?.total ?? 0;
}

export async function findReportFrequency(userId: string) {
  const [row] = await db
    .select({ reportFrequency: user.reportFrequency })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return row?.reportFrequency ?? null;
}

export async function setReportFrequency(
  userId: string,
  frequency: "off" | "weekly" | "monthly",
) {
  await db
    .update(user)
    .set({ reportFrequency: frequency })
    .where(eq(user.id, userId));
}
