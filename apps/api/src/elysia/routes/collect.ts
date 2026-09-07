import { Elysia, t } from "elysia";
import {
  isRequestOriginAllowed,
  resolveNotificationTargets,
  usagePeriod,
} from "@formdrop/core";
import {
  findFormBySlug,
  findFormOwnerEmail,
  listDeliverableRecipients,
  recordSubmission,
} from "@formdrop/core/data";
import { dispatchNotifications } from "../notify";
import { errorSchema } from "../schemas";

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
  async ({ params, body, headers, server, request, status }) => {
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

    const owner = await findFormOwnerEmail(form.userId);
    if (!owner) {
      // Orphaned form: the owner row is gone but the form survived it.
      return status(404, { error: "Form not found" });
    }

    const period = usagePeriod();

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
    });

    // Only the recipient lookup needs the database; which channels actually
    // fire is decided by packages/core, so the rule stays testable without one.
    const recipients = form.emailNotificationsEnabled
      ? await listDeliverableRecipients(form.id)
      : [];

    dispatchNotifications(resolveNotificationTargets(form, owner, recipients), {
      formId: form.id,
      formName: form.name,
      userId: form.userId,
      submissionId: submission.id,
      period,
      payload,
      slackChannelName: form.slackChannelName,
      discordChannelName: form.discordChannelName,
      googleSheetsSheetId: form.googleSheetsSheetId,
      googleSheetsRefreshToken: form.googleSheetsRefreshToken,
      googleSheetsTokenExpiry: form.googleSheetsTokenExpiry,
    });

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
    },
  },
);
