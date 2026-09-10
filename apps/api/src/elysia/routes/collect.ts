import { Elysia, t } from "elysia";
import {
  isRequestOriginAllowed,
  plannedDeliveries,
  resolveNotificationTargets,
  usagePeriod,
} from "@formdrop/core";
import {
  findFormBySlug,
  findFormOwnerEmail,
  listDeliverableRecipients,
  recordSubmission,
} from "@formdrop/core/data";
import { errorSchema } from "../schemas";
import { checkCollectLimit, collectLimitHeaders } from "../rate-limit";
import { captureServer } from "@formdrop/analytics/server";

/**
 * POST /f/:slug -- the endpoint customers' own forms post to.
 *
 * W2: "unchanged path -- this is in the wild, it must never break". Every
 * status code and body below is the one Express returned, including the
 * wording of the error strings.
 *
 * Two things do change, both listed by W2 as corrections to carry in the port:
 *
 *  - The domain allowlist is consulted through isRequestOriginAllowed, so a
 *    request carrying neither Origin nor Referer is now rejected by a form
 *    that has an allowlist. Express skipped the check entirely when both
 *    headers were absent, which made the allowlist trivial to walk past.
 *
 *  - The 500 body no longer carries `details: error.message`. Express returned
 *    the raw exception text to an anonymous caller, which leaks database
 *    errors and schema names to anyone who can reach the endpoint. The message
 *    goes to the log instead.
 */
export const collect = new Elysia().post(
  "/f/:slug",
  async ({ params, body, headers, server, request, status, set }) => {
    const form = await findFormBySlug(params.slug);
    if (!form) return status(404, { error: "Form not found" });

    // A deleted form is answered differently from one that never existed,
    // which is why findFormBySlug does not filter soft-deleted rows.
    if (form.deletedAt) return status(400, { error: "Form is deleted" });

    const origin = headers.origin || headers.referer || null;
    if (!isRequestOriginAllowed(origin, form.allowedDomains ?? [])) {
      return status(403, { error: "Domain not allowed for this form" });
    }

    // Elysia does not reject a malformed or non-object body here -- the body
    // schema is deliberately unconstrained, so a bare string or an array
    // arrives as-is. Without this guard `Object.keys("oops")` yields character
    // indices, which is a non-empty object, and the garbage gets stored.
    const payload =
      body !== null && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : null;

    if (!payload || Object.keys(payload).length === 0) {
      return status(400, { error: "No submission data found" });
    }

    /*
     * Keyed on the form, not the caller's IP (W2: "per-form on collect").
     *
     * Strangers posting from wherever they are is the entire purpose of this
     * endpoint, so an IP limit would throttle a shared NAT or a corporate
     * proxy as if it were one visitor. The form is what a flood damages, so
     * the form is what is protected.
     *
     * Checked after the form resolves, so an unknown slug cannot consume a
     * real form's allowance, and after the origin check so a blocked origin
     * is answered on its own terms.
     */
    const limit = checkCollectLimit(form.id);
    Object.assign(set.headers, collectLimitHeaders(limit));

    if (!limit.allowed) {
      set.headers["retry-after"] = String(limit.retryAfterSeconds);
      return status(429, { error: "Too many submissions, try again shortly" });
    }

    const owner = await findFormOwnerEmail(form.userId);
    if (!owner) {
      // Orphaned form: the owner row is gone but the form survived it.
      return status(404, { error: "Form not found" });
    }

    const period = usagePeriod();

    // Only the recipient lookup needs the database; which channels actually
    // fire is decided by packages/core, so the rule stays testable without one.
    const recipients = form.emailNotificationsEnabled
      ? await listDeliverableRecipients(form.id)
      : [];

    const deliveries = plannedDeliveries(
      resolveNotificationTargets(form, owner, recipients),
    );

    /*
     * Queued in the submission's own transaction, not sent from here (D8).
     *
     * What this replaces fired four requests without awaiting them and
     * returned; anything that failed was logged and dropped, with no retry and
     * nothing the owner could see. Now the intent to deliver is committed
     * with the row it belongs to -- either both exist or neither does -- and
     * the worker owns getting it out.
     *
     * The response is unchanged and still does not wait for delivery, which
     * is what keeps p95 on this endpoint about the write.
     */

    const submission = await recordSubmission({
      formId: form.id,
      userId: form.userId,
      payload,
      ip:
        headers["x-forwarded-for"] ??
        server?.requestIP(request)?.address ??
        null,
      userAgent: headers["user-agent"] ?? null,
      period,
      deliveries,
    });

    /*
     * W6's core event, and one only the server can see: nobody's browser is
     * open when a stranger posts to somebody else's form.
     *
     * Attributed to the form's owner, because they are the person with an
     * account -- filing it under the visitor would create a PostHog person
     * per stranger, which would both distort the numbers and store something
     * about someone who never agreed to it.
     *
     * No properties. The payload is the submission and the privacy rule
     * forbids it; the form id would be a weak identifier of the customer's
     * own site and is not asked for by the taxonomy.
     */
    captureServer(form.userId, "submission_received");

    return status(201, {
      success: true,
      submissionId: submission.id,
      message: "Submission received",
    });
  },
  {
    params: t.Object({ slug: t.String() }),
    // Deliberately unconstrained: a submission payload is whatever fields the
    // customer put on their form. Elysia parses JSON and url-encoded bodies,
    // which is what express.json() and express.urlencoded() accepted.
    body: t.Optional(t.Any()),
    detail: {
      tags: ["Public"],
      summary: "Collect a form submission",
      description:
        "Accepts JSON or url-encoded form data. No authentication; a form " +
        "may restrict which origins can post to it.",
    },
    response: {
      201: t.Object({
        success: t.Boolean(),
        submissionId: t.String({ format: "uuid" }),
        message: t.String(),
      }),
      400: errorSchema,
      403: errorSchema,
      404: errorSchema,
      429: errorSchema,
    },
  },
);
