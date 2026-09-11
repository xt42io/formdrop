import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import { FlagProvider, FlagClient } from "@flagswift/react-client";
import { useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import {
  identifyUser,
  initAnalytics,
  resetAnalytics,
  setSessionRecording,
} from "@formdrop/analytics";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "FormDrop",
      },
    ],
    links: [
      /*
       * Fonts before the stylesheet, and only the weights that are used.
       *
       * This was an @import at the top of styles.css, which cost three
       * serialised round trips -- fetch the stylesheet, parse it, discover
       * the font CSS, fetch that, discover the font files, fetch those --
       * before any text could paint. The preconnects warm both hosts while
       * the stylesheet is still downloading.
       *
       * display=swap is the part that moves LCP. Without it Google Fonts
       * serves font-display: auto, which browsers treat as a block period of
       * around three seconds where the text is simply invisible; the PRD
       * requires the LCP element to be text, so LCP was waiting on the font
       * rather than on the render.
       *
       * Four weights, not eighteen. The product uses 400, 500, 600 and 700 --
       * the rest, and every italic, were being offered for nothing.
       */
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();
  const flagApiKey = import.meta.env.VITE_FLAGSWIFT_CLIENT_API_KEY;

  // Built once per user instead of on every render, and skipped entirely when
  // no key is configured — a missing flag key shouldn't block the whole app.
  const client = useMemo(
    () =>
      flagApiKey
        ? new FlagClient({
            apiKey: flagApiKey,
            environment: import.meta.env.MODE,
            userIdentifier: data?.user?.id,
          })
        : null,
    [flagApiKey, data?.user?.id],
  );

  // Boots once. With no key configured this is a no-op and every capture below
  // becomes one too, so local and preview environments run without analytics.
  useEffect(() => {
    initAnalytics({ key: import.meta.env.VITE_POSTHOG_KEY });
  }, []);

  /*
   * Session replay, scoped (W6): on for the dashboard, off everywhere else.
   *
   * The allowlist is the point. Auth routes are where passwords and one-time
   * codes are typed, and while inputs are masked at the recorder, the right
   * answer for a login screen is no recording rather than a masked one. The
   * marketing pages are excluded too -- there is nothing to learn from
   * replaying a scroll down the pricing page that the funnel events do not
   * already say.
   *
   * /app is matched on a path boundary, so a future /application or
   * /app-store would not quietly opt itself in.
   */
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    const inDashboard = pathname === "/app" || pathname.startsWith("/app/");
    setSessionRecording(inDashboard);
  }, [pathname]);

  // Better Auth owns identity: identify once a session resolves, reset on sign
  // out so the next person on this browser is a separate person, and do neither
  // while the session is still in flight.
  useEffect(() => {
    if (isPending) return;
    if (data?.user?.id) identifyUser(data.user.id);
    else resetAnalytics();
  }, [isPending, data?.user?.id]);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {client ? (
          <FlagProvider client={client}>{children}</FlagProvider>
        ) : (
          children
        )}
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
