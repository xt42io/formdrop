/**
 * Opaque cursors for submission pagination.
 *
 * W2 replaces `GET /:slug/submissions`, which returned *every* submission for
 * a form, with a cursor-paginated list. Offsets are the wrong tool here:
 * submissions arrive constantly, so page 2 of an offset-paginated list skips
 * rows that arrived since page 1 was read.
 *
 * A cursor is the sort key of the last row seen -- createdAt plus id, because
 * createdAt alone is not unique and two submissions in the same millisecond
 * would make a page boundary ambiguous.
 *
 * Base64url so it survives a query string without escaping, and so it reads as
 * an opaque token rather than an invitation to construct one by hand.
 */
export interface SubmissionCursor {
  createdAt: Date;
  id: string;
}

const SEPARATOR = "|";

export function encodeCursor(cursor: SubmissionCursor): string {
  const raw = `${cursor.createdAt.toISOString()}${SEPARATOR}${cursor.id}`;
  return Buffer.from(raw, "utf8").toString("base64url");
}

/**
 * Returns null rather than throwing for anything unreadable.
 *
 * A cursor is client-supplied, and the only thing a caller can do with a
 * malformed one is start again -- so a bad cursor is a 400 the route decides
 * on, not an exception thrown from a decode helper.
 */
export function decodeCursor(value: string): SubmissionCursor | null {
  // Buffer.from is lenient with base64url -- unrecognised characters are
  // dropped rather than raising -- so garbage decodes to a short string that
  // then fails the checks below. There is no error here to handle.
  const raw = Buffer.from(value, "base64url").toString("utf8");

  // The first separator, not the last: an ISO timestamp never contains one,
  // so everything after the first is the id -- even if the id contains one.
  const separator = raw.indexOf(SEPARATOR);
  if (separator === -1) return null;

  const timestamp = raw.slice(0, separator);
  const id = raw.slice(separator + 1);
  if (!id) return null;

  const createdAt = new Date(timestamp);
  if (Number.isNaN(createdAt.getTime())) return null;

  return { createdAt, id };
}

/** W2 caps the page size at 200; anything larger is clamped, not rejected. */
export const MAX_PAGE_SIZE = 200;
export const DEFAULT_PAGE_SIZE = 50;

export function pageSize(requested?: number): number {
  if (requested === undefined || Number.isNaN(requested)) {
    return DEFAULT_PAGE_SIZE;
  }
  if (requested < 1) return 1;
  return Math.min(Math.floor(requested), MAX_PAGE_SIZE);
}
