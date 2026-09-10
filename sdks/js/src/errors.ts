/**
 * Typed errors (PRD W8: "error normalization into typed error classes").
 *
 * The point of normalising is that a caller can branch on what went wrong
 * without reading status codes or parsing message strings. A wrong API key
 * and a form that does not exist are different problems with different
 * remedies, and `catch (e) { if (e.status === 401) }` is how that knowledge
 * gets copied into every codebase that integrates.
 *
 * Every error carries the status and the request id where one is available,
 * because the first thing anyone asks in a support thread is which request
 * this was.
 */
export class FormDropError extends Error {
  /** HTTP status, or 0 when the request never got a response. */
  readonly status: number;
  /** The API's own message, when it sent one. */
  readonly detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "FormDropError";
    this.status = status;
    this.detail = detail;

    // Without this, `instanceof` fails for subclasses when the package is
    // consumed as CJS compiled to ES5 targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 401. The key is missing, malformed or revoked. */
export class FormDropAuthError extends FormDropError {
  constructor(detail?: string) {
    super(detail ?? "Invalid or missing API key", 401, detail);
    this.name = "FormDropAuthError";
  }
}

/** 403. The form refused this origin. */
export class FormDropForbiddenError extends FormDropError {
  constructor(detail?: string) {
    super(detail ?? "Forbidden", 403, detail);
    this.name = "FormDropForbiddenError";
  }
}

/** 404. No such form or submission, or it was deleted. */
export class FormDropNotFoundError extends FormDropError {
  constructor(detail?: string) {
    super(detail ?? "Not found", 404, detail);
    this.name = "FormDropNotFoundError";
  }
}

/** 400. The request was rejected before anything happened. */
export class FormDropValidationError extends FormDropError {
  constructor(detail?: string) {
    super(detail ?? "Invalid request", 400, detail);
    this.name = "FormDropValidationError";
  }
}

/**
 * 429. Carries the wait, so a caller does not have to guess.
 *
 * `retryAfterSeconds` comes from the Retry-After header the API sends. The
 * client already retries these itself; this is only reached once the retries
 * are exhausted.
 */
export class FormDropRateLimitError extends FormDropError {
  readonly retryAfterSeconds?: number;

  constructor(detail?: string, retryAfterSeconds?: number) {
    super(detail ?? "Rate limit exceeded", 429, detail);
    this.name = "FormDropRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** 5xx. Retried before it reaches here, so this means retries ran out. */
export class FormDropServerError extends FormDropError {
  constructor(status: number, detail?: string) {
    super(detail ?? "FormDrop server error", status, detail);
    this.name = "FormDropServerError";
  }
}

/**
 * No response at all: DNS, TLS, offline, or a timeout.
 *
 * Separate from a 5xx because the remedy differs -- one is our problem, the
 * other is the network between us -- and because it is the one case where
 * retrying from the caller's side is usually right.
 */
export class FormDropNetworkError extends FormDropError {
  constructor(cause?: unknown) {
    super("Could not reach FormDrop", 0);
    this.name = "FormDropNetworkError";
    this.cause = cause;
  }
}

/** Maps a response the API rejected into the matching class. */
export function errorForStatus(
  status: number,
  detail: string | undefined,
  retryAfterSeconds?: number,
): FormDropError {
  switch (status) {
    case 400:
      return new FormDropValidationError(detail);
    case 401:
      return new FormDropAuthError(detail);
    case 403:
      return new FormDropForbiddenError(detail);
    case 404:
      return new FormDropNotFoundError(detail);
    case 429:
      return new FormDropRateLimitError(detail, retryAfterSeconds);
    default:
      return status >= 500
        ? new FormDropServerError(status, detail)
        : new FormDropError(detail ?? `Request failed with ${status}`, status, detail);
  }
}
