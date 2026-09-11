# Analytics dashboards (PRD W6)

The PRD names four dashboards. They are **configuration inside PostHog**, not
code, so they are not in this repository and cannot be created from it — they
need someone signed in to the PostHog project. This file is the definition of
each one, so building them is transcription rather than guesswork, and so a
dashboard that gets deleted or drifts can be rebuilt to the same shape.

Every event below is declared in `packages/analytics/src/events.ts`, which is
the single source of truth for the taxonomy. If a name here disagrees with that
file, that file is right.

## 1. Signup → first submission funnel

The activation question: how many people who start a signup ever collect
anything.

| Step | Event |
| --- | --- |
| 1 | `signup_started` |
| 2 | `signup_completed` |
| 3 | `email_verified` |
| 4 | `form_created` |
| 5 | `first_submission_received` |

- Conversion window: **7 days**. Steps 1–4 usually happen in one sitting;
  step 5 waits on the customer deploying their form, which is not our timing.
- `first_submission_received` is captured server-side against the form's
  owner, so it joins the funnel through the same distinct id the browser
  events use.

## 2. Activation by traffic source

The same funnel, broken down by where the person came from.

- Base: the funnel above, steps 1 → 5.
- Breakdown: `$initial_referring_domain` (PostHog's own person property, set
  on first touch — not something the taxonomy has to carry).
- Watch the docs as a source specifically: `docs_viewed` fires from the
  Fumadocs app through the same `/ingest` proxy, so a reader who signs up is
  one person in this breakdown rather than two.

## 3. Notification failure rate by channel

Reliability of the fan-out, which the outbox worker reports.

- Trend A: `notification_failed`, breakdown by `channel`.
- Trend B: `notification_sent`, breakdown by `channel`.
- Display as a **formula**: `A / (A + B)`, as a percentage.
- `notification_failed` fires only when a delivery has exhausted its retries
  (`MAX_ATTEMPTS`, `packages/core/src/outbox.ts`), not on each failed attempt —
  so this is the rate of notifications that never arrived, not the rate of
  transient errors.

## 4. Free → pro conversion

| Step | Event |
| --- | --- |
| 1 | `upgrade_modal_opened` |
| 2 | `checkout_started` |
| 3 | `subscription_activated` |

- Conversion window: **1 day**. Polar's checkout is one sitting; a gap longer
  than that is a new decision, not a slow one.
- Step 3 arrives from the Polar webhook, not the browser — the person paying
  has been handed to Polar and their tab may be gone by the time the money
  clears.
- The drop from 2 to 3 is the useful number: it is the checkout itself
  failing, as distinct from the drop from 1 to 2, which is the price.

## What is deliberately not here

No dashboard slices by form id, submission contents, recipient address or IP.
Those never leave the product as event properties — see
`packages/analytics/src/sanitize.ts` and the tests beside it — so there is
nothing to build a breakdown on, by design.
