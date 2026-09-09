/**
 * What a value looks like after Response.json() and back.
 *
 * The handlers serialise Drizzle rows to JSON, so every Date arrives as an ISO
 * string. Applied at this boundary rather than inside the handlers' types,
 * because the conversion happens in transit: the handler really does hold
 * Dates, and the client really does receive strings.
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

/**
 * The whole transport, on fetch.
 *
 * What this replaces was an axios instance plus a wrapper that hand-rolled the
 * same thing. `Serialized<T>` is applied here rather than inside each handler's
 * type because the Date-to-string conversion happens in transit, not in the
 * handler -- the handler really does hold Dates, and the client really does
 * receive strings.
 *
 * A non-2xx response is not thrown. Every handler answers errors as
 * `{ error }`, callers already narrow with `"error" in response`, and turning
 * half of a documented contract into an exception would mean rewriting all of
 * them for no gain.
 */
export async function apiRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options?: { params?: Record<string, string | number>; body?: unknown },
): Promise<Serialized<T>> {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(options?.params ?? {})) {
    url.searchParams.set(key, String(value));
  }

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      // DELETE with a body is how the bulk endpoints are addressed; fetch
      // allows it, and the handlers read it.
      body:
        options?.body === undefined ? undefined : JSON.stringify(options.body),
    });

    // A handler that fell over before it could answer JSON -- a 502 from a
    // proxy, say -- would otherwise surface as an unreadable parse error.
    const text = await response.text();
    if (!text) {
      return { error: `Request failed (${response.status})` } as Serialized<T>;
    }
    return JSON.parse(text) as Serialized<T>;
  } catch {
    return { error: "An unexpected error occurred" } as Serialized<T>;
  }
}
