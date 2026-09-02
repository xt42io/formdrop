import { createFileRoute } from "@tanstack/react-router";

/**
 * PostHog reverse proxy (PRD W6). The browser talks to `/ingest/*` on our own
 * origin and this forwards it on, so the funnel survives the ad blockers and
 * tracker lists that would otherwise drop requests to `*.posthog.com` — which
 * is exactly the traffic a conversion baseline cannot afford to lose.
 *
 * Two upstreams: the ingestion host takes events, and a sibling assets host
 * serves the library bundle under `/static/`.
 */
const DEFAULT_API_HOST = "https://us.i.posthog.com";

/**
 * Headers that must not be forwarded.
 *
 * `content-length` is the subtle one: we re-read the body and hand fetch a
 * fresh buffer, so passing the original length through makes undici reject the
 * request with "expected non-null body source" instead of sending it.
 */
const STRIPPED_REQUEST_HEADERS = [
  // Our session cookie has no business reaching a third party, and PostHog
  // keeps its own state client-side.
  "cookie",
  "authorization",
  "host",
  "content-length",
  // We forward a decoded body, so let undici negotiate its own encoding.
  "accept-encoding",
  "connection",
];

const STRIPPED_RESPONSE_HEADERS = [
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
];

function upstreamFor(path: string) {
  const apiHost = process.env.POSTHOG_API_HOST ?? DEFAULT_API_HOST;
  // us.i.posthog.com -> us-assets.i.posthog.com, and the same for eu.
  const assetsHost = apiHost.replace(".i.posthog.com", "-assets.i.posthog.com");
  return path.startsWith("/static/") ? assetsHost : apiHost;
}

async function forward(request: Request) {
  const incoming = new URL(request.url);
  const path = incoming.pathname.replace(/^\/ingest/, "") || "/";
  const target = new URL(path + incoming.search, upstreamFor(path));

  const headers = new Headers(request.headers);
  for (const header of STRIPPED_REQUEST_HEADERS) headers.delete(header);

  // An empty buffer is not the same as no body to undici, and preflights and
  // beacons both arrive bodyless on methods that usually carry one.
  const buffered =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
  const body = buffered && buffered.byteLength > 0 ? buffered : undefined;

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    for (const header of STRIPPED_RESPONSE_HEADERS) {
      responseHeaders.delete(header);
    }

    // Buffered rather than streamed: passing an upstream stream back through
    // the dev server resets the connection, and these payloads are small.
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    // Analytics must never take the site down with it. A rejected fetch here
    // would otherwise surface as an unhandled rejection and kill the process.
    console.error("PostHog proxy failed:", error);
    return new Response(null, { status: 502 });
  }
}

export const Route = createFileRoute("/ingest/$")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => forward(request),
      POST: ({ request }: { request: Request }) => forward(request),
      OPTIONS: ({ request }: { request: Request }) => forward(request),
    },
  },
});
