/**
 * The event taxonomy from the PRD (W6), `object_action` in snake case.
 *
 * This map is the single source of truth. `capture()` accepts only a name from
 * it, and takes a properties argument exactly when the event declares one, so a
 * typo or a forgotten property is a type error rather than a silently malformed
 * funnel that nobody notices until the dashboard is empty.
 *
 * Properties appear only where the PRD specifies them. Marketing and onboarding
 * are wired now for the P0 baseline; core and monetization are declared here so
 * the names are settled before P5 wires them, and adding a call site later
 * needs no change to this file.
 */
export type AnalyticsEventMap = {
  // Marketing
  landing_viewed: void;
  hero_cta_clicked: void;
  pricing_viewed: void;
  docs_viewed: { page: string };
  snippet_copied: { language: string };

  // Onboarding
  signup_started: void;
  signup_completed: void;
  email_verified: void;
  form_created: void;
  first_submission_received: void;

  // Core
  submission_received: void;
  notification_sent: { channel: string };
  notification_failed: { channel: string };
  integration_connected: { provider: string };
  submissions_exported: void;
  api_key_created: void;

  // Monetization
  upgrade_modal_opened: void;
  checkout_started: void;
  subscription_activated: void;
};

export type AnalyticsEvent = keyof AnalyticsEventMap;

/**
 * One `capture()` signature for every event: `[name]` on its own for events
 * that carry no properties, `[name, properties]` for the ones that do.
 */
export type CaptureArgs<E extends AnalyticsEvent = AnalyticsEvent> =
  AnalyticsEventMap[E] extends void
    ? [event: E]
    : [event: E, properties: AnalyticsEventMap[E]];
