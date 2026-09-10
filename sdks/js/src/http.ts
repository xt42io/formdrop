import {
  FormDropError,
  FormDropNetworkError,
  errorForStatus,
} from "./errors.js";

/**
 * The transport (PRD W8: "retries with backoff on 5xx and 429, and an
 * AbortSignal pass-through").
 *
 * Zero dependencies, so this is `fetch` and arithmetic. On Node 18+ and every
 * browser fetch is global, which is why the package needs no polyfill and no
 * http client in its dependency list.
 */

export interface SendOptions {
  method: string;
  url: string;
  apiKey?: string;
  /** A JSON-serialisable value, or FormData, or nothing. */
  body?: unknown;
  signal?: AbortSignal;
  retries: number;
  fetchImpl: typeof globalThis.fetch;
}

/** Only these are worth trying again. Everything else is the caller's. */
function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * How long to wait before attempt `n`, in milliseconds.
 *
 * Exponential from 250ms, with jitter. The jitter is not decoration: without
 * it, everything that failed during one outage retries in lockstep and
 * arrives together the moment the service returns, which is how a recovering
 * server gets knocked over again.
 */
function backoffMs(attempt: number): number {
  const base = Math.min(250 * 2 ** attempt, 4000);
  return base + Math.random() * base * 0.25;
}

/** Honours Retry-After when the server sends one, in seconds or as a date. */
function retryAfterMs(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (!header) return null;

  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

/** A sleep that an abort cuts short rather than leaving pending. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("Aborted"));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error("Aborted"));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** The API sends `{ error }` on every failure; this digs it out safely. */
async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const { error } = body as { error: unknown };
      if (typeof error === "string") return error;
    }
  } catch {
    // A non-JSON error body -- a proxy's HTML 502, say. The status is still
    // the useful part, so this is not worth failing over.
  }
  return undefined;
}

export async function send<T>(options: SendOptions): Promise<T> {
  const { method, url, apiKey, body, signal, retries, fetchImpl } = options;

  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    // Deliberately no content-type: the runtime sets it, and it has to
    // include the multipart boundary, which we cannot know.
    payload = body;
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let lastError: FormDropError | undefined;
  /*
   * Local, not module scope.
   *
   * A 429's Retry-After has to survive from one attempt to the next, and the
   * obvious place to keep it is a module variable -- which would be wrong:
   * two concurrent send() calls interleave freely, so one request's wait
   * would be applied to another's backoff.
   */
  let retryAfter: number | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const wait =
        lastError?.status === 429 && retryAfter !== null
          ? retryAfter
          : backoffMs(attempt - 1);
      await sleep(wait, signal);
    }

    let response: Response;
    try {
      response = await fetchImpl(url, { method, headers, body: payload, signal });
    } catch (cause) {
      // An abort is the caller's instruction, not a failure to retry past.
      if (signal?.aborted) throw cause;
      lastError = new FormDropNetworkError(cause);
      retryAfter = null;
      continue;
    }

    if (response.ok) {
      // 204 and friends have no body; everything this API returns does.
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    }

    const detail = await readErrorDetail(response);
    const after = retryAfterMs(response);
    retryAfter = after;
    lastError = errorForStatus(
      response.status,
      detail,
      after === null ? undefined : Math.ceil(after / 1000),
    );

    if (!isRetryable(response.status)) throw lastError;
  }

  throw lastError ?? new FormDropNetworkError();
}