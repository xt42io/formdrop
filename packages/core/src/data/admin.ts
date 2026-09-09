import { db } from "@formdrop/db";
import { forms, submissions, user } from "@formdrop/db/schema";
import { count, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";

/**
 * Admin reads and maintenance.
 *
 * These deliberately span every user's data, which is exactly why they are
 * grouped and named as admin: nothing here is scoped to an owner, so calling
 * one of them from a non-admin route would leak across accounts. The role
 * check stays in the handler, where the session lives.
 */

/** Counted per-form as a correlated subquery so a form with none still lists. */
const FORM_SUBMISSION_COUNT = sql<number>`(
                SELECT COUNT(*)::int
                FROM submissions
                WHERE submissions.form_id = forms.id
                AND submissions.deleted_at IS NULL
              )`.as("submissionCount");

export async function countAllUsers(): Promise<number> {
  const [result] = await db.select({ count: count() }).from(user);
  return result.count;
}

export async function countAllForms(): Promise<number> {
  const [result] = await db.select({ count: count() }).from(forms);
  return result.count;
}

/** Live submissions only — soft-deleted rows are not part of the total. */
export async function countAllSubmissions(): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(submissions)
    .where(isNull(submissions.deletedAt));
  return result.count;
}

export function usersCreatedSince(since: Date) {
  return db
    .select({
      date: sql<string>`DATE(${user.createdAt})`,
      count: count(),
    })
    .from(user)
    .where(gte(user.createdAt, since))
    .groupBy(sql`DATE(${user.createdAt})`)
    .orderBy(sql`DATE(${user.createdAt})`);
}

export function submissionsCreatedSince(since: Date) {
  return db
    .select({
      date: sql<string>`DATE(${submissions.createdAt})`,
      count: count(),
    })
    .from(submissions)
    .where(
      sql`${submissions.createdAt} >= ${since} AND ${submissions.deletedAt} IS NULL`,
    )
    .groupBy(sql`DATE(${submissions.createdAt})`)
    .orderBy(sql`DATE(${submissions.createdAt})`);
}

export function topFormsAcrossAllUsers(limit: number) {
  return db
    .select({
      formId: submissions.formId,
      formName: forms.name,
      count: count(),
    })
    .from(submissions)
    .innerJoin(forms, sql`${submissions.formId} = ${forms.id}`)
    .where(isNull(submissions.deletedAt))
    .groupBy(submissions.formId, forms.name)
    .orderBy(desc(count()))
    .limit(limit);
}

export function listAllFormsWithOwners() {
  return db
    .select({
      id: forms.id,
      name: forms.name,
      userId: forms.userId,
      userName: user.name,
      createdAt: forms.createdAt,
      submissionCount: FORM_SUBMISSION_COUNT,
    })
    .from(forms)
    .innerJoin(user, eq(forms.userId, user.id))
    .orderBy(sql`${forms.createdAt} DESC`);
}

export function listRecentSubmissionsAcrossAllForms(limit: number) {
  return db
    .select({
      id: submissions.id,
      formId: submissions.formId,
      formName: forms.name,
      createdAt: submissions.createdAt,
      payload: submissions.payload,
    })
    .from(submissions)
    .innerJoin(forms, eq(submissions.formId, forms.id))
    .where(isNull(submissions.deletedAt))
    .orderBy(desc(submissions.createdAt))
    .limit(limit);
}

/**
 * How many rows the retention tool would remove.
 *
 * Exists so the confirmation can name a number. PRD 4.6 asks for the
 * maintenance actions to sit "behind an explicit confirm that names what will
 * be deleted and how many rows", and that is not a nicety here: the delete
 * below is a hard one, so an operator who guesses wrong does not get the rows
 * back.
 *
 * It is a separate query from the delete rather than a dry-run flag, so the
 * two cannot be confused for one another at the call site. The count can go
 * stale between reading and deleting -- submissions age past the cutoff by the
 * second -- which is why the result reports what was actually removed rather
 * than assuming this number held.
 */
export async function countSubmissionsOlderThan(cutoff: Date): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(submissions)
    .where(lt(submissions.createdAt, cutoff));

  return row?.value ?? 0;
}

/**
 * A hard delete, unlike everywhere else in this package — the admin
 * retention tool removes rows rather than marking them deleted, so these do
 * not come back. Returns how many went.
 */
export async function deleteSubmissionsOlderThan(
  cutoff: Date,
): Promise<number> {
  const result = await db
    .delete(submissions)
    .where(lt(submissions.createdAt, cutoff))
    .returning({ id: submissions.id });

  return result.length;
}

export async function findUserDetail(userId: string) {
  const [detail] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId));

  return detail ?? null;
}

export function listFormsForUserWithCounts(userId: string) {
  return db
    .select({
      id: forms.id,
      name: forms.name,
      createdAt: forms.createdAt,
      submissionCount: FORM_SUBMISSION_COUNT,
    })
    .from(forms)
    .where(sql`${forms.userId} = ${userId} AND ${forms.deletedAt} IS NULL`)
    .orderBy(sql`${forms.createdAt} DESC`);
}

export function listRecentSubmissionsForUser(userId: string, limit: number) {
  return db
    .select({
      id: submissions.id,
      formId: submissions.formId,
      formName: forms.name,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .innerJoin(forms, eq(submissions.formId, forms.id))
    .where(
      sql`${forms.userId} = ${userId} AND ${submissions.deletedAt} IS NULL`,
    )
    .orderBy(sql`${submissions.createdAt} DESC`)
    .limit(limit);
}
