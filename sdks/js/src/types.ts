/**
 * The shapes the API returns.
 *
 * These mirror `apps/api/src/elysia/schemas.ts`, which is what the OpenAPI
 * spec is generated from. Dates are strings here for the same reason they are
 * strings there: JSON has no date type, and declaring `Date` would be a lie
 * the compiler happily tells until somebody calls `.getTime()` on it.
 */

/** A form, as `/v1/forms` returns it. */
export interface Form {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** ISO 8601. */
  createdAt: string;
}

/** A submission, as `/v1/forms/:slug/submissions` returns it. */
export interface Submission {
  id: string;
  formId: string;
  /** Whatever fields the form was posted; the API does not constrain them. */
  payload: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  /** ISO 8601. */
  createdAt: string;
}

/**
 * One page of submissions.
 *
 * `nextCursor` is null on the last page. Pass it back as `cursor` to
 * continue -- do not construct one, the encoding is the API's business.
 */
export interface SubmissionPage {
  data: Submission[];
  nextCursor: string | null;
}

/** What `POST /f/:slug` answers with. */
export interface SubmitResult {
  success: boolean;
  submissionId: string;
  message: string;
}

/** A submission body: JSON-serialisable fields, or a FormData. */
export type SubmissionInput = Record<string, unknown> | FormData;

/** Options every request accepts. */
export interface RequestOptions {
  /** Cancels the request, and any retry still pending. */
  signal?: AbortSignal;
}

export interface ListSubmissionsOptions extends RequestOptions {
  /** Defaults to 50 at the API, capped at 200. */
  limit?: number;
  /** The previous page's `nextCursor`. */
  cursor?: string;
}

export interface FormDropOptions {
  /** Required for everything except `FormDrop.submit`. */
  apiKey?: string;
  /** Defaults to the production API. Point it at staging in tests. */
  baseUrl?: string;
  /**
   * Attempts after a 5xx or 429 before giving up. Defaults to 2, so a request
   * is made at most three times.
   */
  retries?: number;
  /**
   * Injected for tests and for runtimes with an unusual fetch. Defaults to
   * the global, which is why this package needs no polyfill on Node 18+.
   */
  fetch?: typeof globalThis.fetch;
}
