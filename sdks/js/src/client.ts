import { send } from "./http.js";
import { FormDropAuthError } from "./errors.js";
import type {
  Form,
  FormDropOptions,
  ListSubmissionsOptions,
  RequestOptions,
  Submission,
  SubmissionInput,
  SubmissionPage,
  SubmitResult,
} from "./types.js";

/** Where the API lives unless a caller says otherwise. */
export const DEFAULT_BASE_URL = "https://api.formdrop.co";

/**
 * Percent-encodes a path segment.
 *
 * Slugs are ours and tame, but ids and cursors arrive from callers and a
 * stray slash would silently change which endpoint is addressed.
 */
const seg = (value: string) => encodeURIComponent(value);

/**
 * The FormDrop client (PRD W8).
 *
 * Two ways in, because there are two audiences. `FormDrop.submit` is static
 * and takes no key -- it is the call a form on somebody's website makes, and
 * requiring a credential there would mean shipping one to the browser. The
 * constructed client takes an API key and reads data back, which is a server
 * job.
 *
 * Everything the PRD asks this to own lives below the surface: endpoint
 * construction, JSON *and* FormData bodies, errors normalised into typed
 * classes, retries with backoff on 5xx and 429, and an AbortSignal passed
 * through to every request.
 */
export class FormDrop {
  readonly #apiKey?: string;
  readonly #baseUrl: string;
  readonly #retries: number;
  readonly #fetch: typeof globalThis.fetch;

  constructor(options: FormDropOptions = {}) {
    this.#apiKey = options.apiKey;
    // Trailing slashes are the classic way to end up requesting //v1/forms.
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.#retries = options.retries ?? 2;

    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      throw new TypeError(
        "No fetch available. Use Node 18+, or pass one as `fetch`.",
      );
    }
    // Bound, or a browser's fetch throws "Illegal invocation" once detached
    // from window.
    this.#fetch = fetchImpl.bind(globalThis);
  }

  /**
   * Sends a submission to a form. No API key.
   *
   * The static form of the call the product exists for. Accepts a plain
   * object or a FormData -- the latter is what you get from
   * `new FormData(formElement)`, so wiring up an existing form is one line.
   */
  static submit(
    slug: string,
    data: SubmissionInput,
    options: RequestOptions & Pick<FormDropOptions, "baseUrl" | "fetch"> = {},
  ): Promise<SubmitResult> {
    return new FormDrop({
      baseUrl: options.baseUrl,
      fetch: options.fetch,
    }).submit(slug, data, options);
  }

  /** The instance form, for when a base URL or retry policy is configured. */
  submit(
    slug: string,
    data: SubmissionInput,
    options: RequestOptions = {},
  ): Promise<SubmitResult> {
    return this.#request<SubmitResult>({
      method: "POST",
      path: `/f/${seg(slug)}`,
      body: data,
      signal: options.signal,
      // Collect is the one public endpoint, so it is the one call that must
      // not carry the key even when the client has one.
      anonymous: true,
    });
  }

  readonly forms = {
    list: (options: RequestOptions = {}): Promise<Form[]> =>
      this.#request<{ forms: Form[] }>({
        method: "GET",
        path: "/v1/forms",
        signal: options.signal,
      }).then((r) => r.forms),

    create: (
      input: { name: string; description?: string },
      options: RequestOptions = {},
    ): Promise<Form> =>
      this.#request<{ form: Form }>({
        method: "POST",
        path: "/v1/forms",
        body: input,
        signal: options.signal,
      }).then((r) => r.form),

    get: (slug: string, options: RequestOptions = {}): Promise<Form> =>
      this.#request<{ form: Form }>({
        method: "GET",
        path: `/v1/forms/${seg(slug)}`,
        signal: options.signal,
      }).then((r) => r.form),

    delete: (slug: string, options: RequestOptions = {}): Promise<void> =>
      this.#request<unknown>({
        method: "DELETE",
        path: `/v1/forms/${seg(slug)}`,
        signal: options.signal,
      }).then(() => undefined),

    submissions: {
      /** One page, newest first. Pass the previous `nextCursor` to continue. */
      list: (
        slug: string,
        options: ListSubmissionsOptions = {},
      ): Promise<SubmissionPage> => {
        const query = new URLSearchParams();
        if (options.limit !== undefined) query.set("limit", String(options.limit));
        if (options.cursor) query.set("cursor", options.cursor);
        const qs = query.toString();

        return this.#request<SubmissionPage>({
          method: "GET",
          path: `/v1/forms/${seg(slug)}/submissions${qs ? `?${qs}` : ""}`,
          signal: options.signal,
        });
      },

      get: (
        slug: string,
        id: string,
        options: RequestOptions = {},
      ): Promise<Submission> =>
        this.#request<{ submission: Submission }>({
          method: "GET",
          path: `/v1/forms/${seg(slug)}/submissions/${seg(id)}`,
          signal: options.signal,
        }).then((r) => r.submission),

      delete: (
        slug: string,
        id: string,
        options: RequestOptions = {},
      ): Promise<void> =>
        this.#request<unknown>({
          method: "DELETE",
          path: `/v1/forms/${seg(slug)}/submissions/${seg(id)}`,
          signal: options.signal,
        }).then(() => undefined),

      /** Deletes many at once. The API rejects an empty list. */
      deleteMany: (
        slug: string,
        ids: string[],
        options: RequestOptions = {},
      ): Promise<void> =>
        this.#request<unknown>({
          method: "DELETE",
          path: `/v1/forms/${seg(slug)}/submissions`,
          body: { ids },
          signal: options.signal,
        }).then(() => undefined),
    },
  };

  /**
   * Every request goes through here.
   *
   * The key check is local rather than a round trip: an authenticated call
   * from a client built without one can only ever come back 401, and failing
   * before the request says which mistake was made instead of echoing the
   * API's generic answer.
   */
  #request<T>(options: {
    method: string;
    path: string;
    body?: unknown;
    signal?: AbortSignal;
    anonymous?: boolean;
  }): Promise<T> {
    if (!options.anonymous && !this.#apiKey) {
      return Promise.reject(
        new FormDropAuthError(
          "This call needs an API key: new FormDrop({ apiKey }).",
        ),
      );
    }

    return send<T>({
      method: options.method,
      url: `${this.#baseUrl}${options.path}`,
      apiKey: options.anonymous ? undefined : this.#apiKey,
      body: options.body,
      signal: options.signal,
      retries: this.#retries,
      fetchImpl: this.#fetch,
    });
  }
}
