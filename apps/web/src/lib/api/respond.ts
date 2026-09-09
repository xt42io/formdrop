/**
 * A `Response` that remembers what it was built from.
 *
 * The dashboard's API handlers all end in `Response.json(...)`, whose return
 * type is just `Response` -- the payload shape is erased the moment it is
 * built. So the client had no choice but to restate every envelope by hand
 * (`{ forms: Form[] }`, `{ form: FormDetail }`, `{ success: boolean }`), which
 * is precisely the drift W3 asks us to end: rename a key in a handler and
 * nothing tells you the client still expects the old one.
 *
 * `json()` is `Response.json()` with the payload type carried along in a phantom
 * field. It emits exactly the same Response at runtime -- the field never
 * exists -- but the type survives, so `PayloadOf<ReturnType<handler>>` gives
 * back what that handler can actually return.
 *
 * Because a handler returns from several branches, that type comes back as a
 * union of successes and errors, which is the shape the client already models:
 * `"error" in response` narrows it.
 *
 * The brand is a required unique symbol, not an optional field, and that is
 * load-bearing. With an optional one, a plain `Response` structurally satisfies
 * `Json<unknown>` -- so a single branch still returning `new Response(...)`
 * infers its payload as `unknown`, and `unknown` swallows the rest of the
 * union. One missed conversion silently turned an entire endpoint's type back
 * into `any` in all but name. A required brand makes that branch simply not
 * match, which is a hole you can see rather than one that hides.
 */
declare const payload: unique symbol;

export type Json<T> = Response & { readonly [payload]: T };

export function json<T>(data: T, init?: ResponseInit): Json<T> {
  return Response.json(data, init) as Json<T>;
}

/** The payload a `json()` response carries. Distributes over a union. */
export type PayloadOf<R> = R extends Json<infer T> ? T : never;

/** What a handler can resolve to, as a union of every branch's payload. */
export type HandlerPayload<H extends (...args: never[]) => unknown> = PayloadOf<
  Awaited<ReturnType<H>>
>;
