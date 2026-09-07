import { db } from "@formdrop/db";
import { submissions } from "@formdrop/db/schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
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
