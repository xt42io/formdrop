import { db } from "@formdrop/db";
import { submissions } from "@formdrop/db/schema";
import { and, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { count } from "drizzle-orm";

/**
 * Submission queries.
 *
 * Every read filters out soft-deleted rows, which is the reason these live in
 * one place: a handler that forgot `isNull(deletedAt)` would quietly resurrect
 * deleted submissions in a list or a count.
 */
const live = (formId: string) =>
  and(eq(submissions.formId, formId), isNull(submissions.deletedAt));

export async function countSubmissionsForForm(formId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(submissions)
    .where(live(formId));

  return result?.count || 0;
}

/** Newest first, offset paginated to match the dashboard's page/limit params. */
export function listSubmissionsForForm(
  formId: string,
  options: { limit: number; offset: number },
) {
  return db
    .select()
    .from(submissions)
    .where(live(formId))
    .orderBy(desc(submissions.createdAt))
    .limit(options.limit)
    .offset(options.offset);
}

/**
 * Used to confirm a batch of ids really belongs to the form before deleting.
 * Deliberately does not filter deletedAt: the caller compares the returned
 * count against what was asked for, and an already-deleted id should still
 * count as belonging to the form.
 */
export function findSubmissionsInForm(formId: string, submissionIds: string[]) {
  return db
    .select()
    .from(submissions)
    .where(
      and(
        inArray(submissions.id, submissionIds),
        eq(submissions.formId, formId),
      ),
    );
}

export async function softDeleteSubmissions(submissionIds: string[]) {
  await db
    .update(submissions)
    .set({ deletedAt: new Date() })
    .where(inArray(submissions.id, submissionIds));
}

/**
 * One submission, scoped to its form so an id from another form cannot be
 * read. Like findSubmissionsInForm, this does not filter deletedAt — that
 * matches the existing detail route, where a soft-deleted submission is still
 * fetchable by its id.
 */
export async function findSubmissionInForm(
  formId: string,
  submissionId: string,
) {
  const [submission] = await db
    .select()
    .from(submissions)
    .where(
      and(eq(submissions.id, submissionId), eq(submissions.formId, formId)),
    )
    .limit(1);

  return submission ?? null;
}

/** Scoped by form as well as id, so a mismatched pair deletes nothing. */
export async function softDeleteSubmission(
  formId: string,
  submissionId: string,
) {
  await db
    .update(submissions)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(submissions.id, submissionId), eq(submissions.formId, formId)),
    );
}

/**
 * Cursor-paginated, for the public API.
 *
 * Separate from listSubmissionsForForm rather than replacing it: the dashboard
 * pages by offset because it shows numbered pages, while the API pages by
 * cursor because submissions arrive continuously and an offset would skip rows
 * that landed between requests.
 *
 * The sort is (createdAt, id) descending. The id tiebreak is what makes the
 * page boundary unambiguous when two submissions share a millisecond -- with
 * createdAt alone, a row could be returned twice or skipped entirely.
 *
 * One extra row is fetched beyond the requested limit, which is how the caller
 * learns whether another page exists without a second count query.
 */
export function pageSubmissionsForForm(
  formId: string,
  options: { limit: number; after?: { createdAt: Date; id: string } },
) {
  const after = options.after;

  return db
    .select()
    .from(submissions)
    .where(
      after
        ? and(
            live(formId),
            or(
              lt(submissions.createdAt, after.createdAt),
              and(
                eq(submissions.createdAt, after.createdAt),
                sql`${submissions.id} < ${after.id}`,
              ),
            ),
          )
        : live(formId),
    )
    .orderBy(desc(submissions.createdAt), desc(submissions.id))
    .limit(options.limit + 1);
}

/**
 * Every live submission for a form, unbounded.
 *
 * This exists only to keep the legacy `GET /:slug/submissions` alias
 * byte-compatible: it returned the entire history with no limit, and D6 keeps
 * that alias indefinitely. W2 replaces it for new callers with
 * pageSubmissionsForForm, which is what /v1 uses.
 *
 * Deliberately not used anywhere else. An unbounded read of a table that grows
 * with every submission is a footgun, and the only reason to accept it here is
 * that changing the response would break callers already in the wild.
 */
export function listAllSubmissionsForForm(formId: string) {
  return db
    .select()
    .from(submissions)
    .where(live(formId))
    .orderBy(desc(submissions.createdAt));
}
