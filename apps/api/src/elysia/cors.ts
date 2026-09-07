import { cors } from "@elysiajs/cors";

/**
 * Which paths a browser may call cross-origin.
 *
 * `POST /f/:slug` is called from customers' own sites, so it must accept any
 * origin. Health is harmless. Everything under /v1 takes an API key, which
 * makes it a server-to-server surface -- a browser has no business reaching it
 * cross-origin, and Express today says otherwise: it applies
 * `cors({ origin: "*" })` to the whole API, key-authenticated routes included.
 */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" || pathname === "/health" || pathname.startsWith("/f/")
  );
}

/**
 * Mounted once on the root app rather than per route group.
 *
 * That is not a stylistic choice: @elysiajs/cors registers its hooks globally,
 * so mounting it inside a route group leaks the headers to every other route --
 * which is exactly the bug this is meant to fix, reintroduced by the fix.
 * Scoping therefore happens in the `origin` predicate, which is consulted per
 * request and can see the path.
 */
export const scopedCors = cors({
  origin: (request) => isPublicPath(new URL(request.url).pathname),
});
