"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { capture, initAnalytics } from "@formdrop/analytics";

/**
 * `docs_viewed` (PRD W6), the marketing end of the taxonomy.
 *
 * The docs are a separate Next application, so they need their own init --
 * but they are served from formdrop.co/docs through the proxy in apps/web,
 * same origin, so the default `/ingest` host reaches PostHog exactly as it
 * does from the marketing pages. Reader and customer are one person in the
 * funnel rather than two, which is the point of not putting docs on a
 * subdomain.
 *
 * Next's client environment needs the NEXT_PUBLIC_ prefix; apps/web reads the
 * same project through VITE_POSTHOG_KEY. Both unset is a supported state and
 * every call below becomes a no-op.
 */
export function Analytics() {
  const pathname = usePathname();
  const lastCaptured = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics({ key: process.env.NEXT_PUBLIC_POSTHOG_KEY });
  }, []);

  useEffect(() => {
    // React runs effects twice in development's strict mode, and the app
    // router can re-render a layout without the path having changed. Either
    // would double every page in the funnel, so the last path wins.
    if (!pathname || lastCaptured.current === pathname) return;
    lastCaptured.current = pathname;

    // The path, not the title: it is stable across copy edits, it is what a
    // dashboard filter is written against, and it carries nothing about the
    // reader.
    capture("docs_viewed", { page: pathname });
  }, [pathname]);

  return null;
}
