import { db } from "@formdrop/db";
import { forms, usage } from "@formdrop/db/schema";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";

/**
 * Analytics reads.
 *
 * Counts are summed from the usage table rather than counted from submissions,
 * which is what keeps them correct after a submission is soft-deleted.
 *
 * Postgres returns SUM as a string and NULL when nothing matches, so every
 * total is coerced here — previously each handler repeated `Number(x ?? 0)` at
 * the call site, and one missing coercion produces string concatenation
 * instead of arithmetic.
 */
const ownedByUser = (userId: string) =>
  and(eq(forms.userId, userId), isNull(forms.deletedAt));

export async function countFormsForUser(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(forms)
    .where(ownedByUser(userId));

  return Number(result?.count || 0);
}

/** Total submissions across a user's live forms, optionally from a period on. */
export async function sumUsageForUser(
  userId: string,
  options: { from?: string } = {},
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`sum(${usage.count})` })
    .from(usage)
    .innerJoin(forms, eq(usage.formId, forms.id))
    .where(
      options.from
        ? and(ownedByUser(userId), gte(usage.period, options.from))
        : ownedByUser(userId),
    );

  return Number(result?.count || 0);
}

/** One row per period that has usage; gaps are the caller's to fill. */
export async function dailyUsageForUser(userId: string, from: string) {
  const rows = await db
    .select({
      date: usage.period,
      count: sql<number>`sum(${usage.count})`,
    })
    .from(usage)
    .innerJoin(forms, eq(usage.formId, forms.id))
    .where(and(ownedByUser(userId), gte(usage.period, from)))
    .groupBy(usage.period)
    .orderBy(usage.period);

  return rows.map((row) => ({ date: row.date, count: Number(row.count || 0) }));
}

/**
 * Per-form totals. `from` filters to periods on or after a day, `on` to a
 * single day — the form analytics screen needs all-time, this month and today.
 */
export async function sumUsageForForm(
  formId: string,
  options: { from?: string; on?: string } = {},
): Promise<number> {
  const filters = [eq(usage.formId, formId)];
  if (options.from) filters.push(gte(usage.period, options.from));
  if (options.on) filters.push(eq(usage.period, options.on));

  const [result] = await db
    .select({ count: sql<number>`sum(${usage.count})` })
    .from(usage)
    .where(and(...filters));

  return Number(result?.count || 0);
}

export async function dailyUsageForForm(formId: string, from: string) {
  const rows = await db
    .select({
      date: usage.period,
      count: sql<number>`sum(${usage.count})`,
    })
    .from(usage)
    .where(and(eq(usage.formId, formId), gte(usage.period, from)))
    .groupBy(usage.period)
    .orderBy(usage.period);

  return rows.map((row) => ({ date: row.date, count: Number(row.count || 0) }));
}

export async function topFormsForUser(userId: string, limit: number) {
  const rows = await db
    .select({
      id: forms.id,
      name: forms.name,
      submissionCount: sql<number>`sum(${usage.count})`,
    })
    .from(forms)
    .leftJoin(usage, eq(forms.id, usage.formId))
    .where(ownedByUser(userId))
    .groupBy(forms.id, forms.name)
    .orderBy(desc(sql`sum(${usage.count})`))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    submissionCount: Number(row.submissionCount || 0),
  }));
}
