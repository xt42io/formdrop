import type { paths } from "./generated/openapi.ts";

/**
 * The shapes the API returns, derived from the OpenAPI spec.
 *
 * These used to be hand-written copies of `apps/api/src/elysia/schemas.ts`,
 * which meant a field renamed in the API left the SDK's types confidently
 * wrong until somebody noticed. The PRD asks for types generated from the
 * spec, and this is that: `src/generated/openapi.ts` comes out of
 * `apps/api/openapi.json`, and everything below is an alias into it.
 *
 * The aliases exist because the spec has no `components/schemas` -- Elysia
 * inlines every response shape -- so the raw generated path is unreadable and
 * would leak into user-facing signatures. Naming them here keeps the public
 * surface legible while the definitions still come from the API.
 *
 * The practical effect: rename a field in the API, regenerate, and this
 * package stops compiling. That is the point.
 */

/**
 * The JSON body of one response, by status.
 *
 * Parameterised on the code because collect answers 201 rather than 200 --
 * hardcoding the success status made SubmitResult resolve to `never`, which
 * the compiler then happily carried until a test dereferenced it.
 */
type Body<
  P extends keyof paths,
  M extends keyof paths[P],
  S extends number = 200,
> = paths[P][M] extends {
  responses: Record<S, { content: { "application/json": infer B } }>;
}
  ? B
  : never;

/** A form, as `/v1/forms` returns it. */
export type Form = Body<"/v1/forms", "get">["forms"][number];

/**
 * One page of submissions.
 *
 * `nextCursor` is null on the last page. Pass it back as `cursor` to
 * continue -- do not construct one, the encoding is the API's business.
 */
export type SubmissionPage = Body<"/v1/forms/{slug}/submissions", "get">;

/** A submission, as `/v1/forms/:slug/submissions` returns it. */
export type Submission = SubmissionPage["data"][number];

/** What `POST /f/:slug` answers with. */
export type SubmitResult = Body<"/f/{slug}", "post", 201>;

/** A submission body: JSON-serialisable fields, or a FormData. */
export type SubmissionInput = Record<string, unknown> | FormData;

/**
 * Options every request accepts.
 *
 * Below this line nothing is derived. These describe how the client behaves,
 * not what the API returns, so the spec has no opinion on them.
 */
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
