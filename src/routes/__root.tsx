import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import { FlagProvider, FlagClient } from "@flagswift/react-client";
import { useMemo } from "react";
import { useSession } from "@/lib/auth-client";

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
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
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
