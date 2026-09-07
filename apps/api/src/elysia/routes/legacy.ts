import { Elysia, t } from "elysia";
import {
  findOwnedForm,
  findSubmissionInForm,
  findSubmissionsInForm,
  listAllSubmissionsForForm,
  listFormsForApiKey,
  softDeleteForm,
  softDeleteSubmission,
  softDeleteSubmissions,
} from "@formdrop/core/data";
import { apiKeyAuth } from "../auth";
import { serializeForm, serializeSubmission } from "../schemas";

/**
 * The five authenticated paths the Express API served, kept indefinitely.
 *
 * D6: no sunset and no deprecation notice -- they cost one route definition
 * each and nothing breaks for anyone still calling them. They are excluded
 * from the OpenAPI document (`detail: { hide: true }`) so new integrations are
 * not written against them, and every call emits a log line so their usage is
 * visible if that decision is ever revisited.
 *
 * These reproduce the old shapes exactly, which is the point: forms addressed
 * by id rather than slug, the whole submission history with no pagination, and
 * a bulk-delete body keyed `submissionIds` rather than `ids`. /v1 is where the
 * corrected shapes live.
 */
function recordLegacyCall(route: string, userId: string) {
  console.log(
    JSON.stringify({
      level: "info",
      event: "legacy_api_call",
      route,
      userId,
    }),
  );
}

const hidden = { hide: true } as const;

export const legacyRoutes = new Elysia()
  .use(apiKeyAuth)
  .get(
    "/forms",
    async ({ key }) => {
      recordLegacyCall("GET /forms", key.userId);
      return {
        forms: (await listFormsForApiKey(key.userId)).map(serializeForm),
      };
    },
    { apiKey: true, detail: hidden },
  )
  .delete(
    "/forms/:formId",
    async ({ key, params, status }) => {
      recordLegacyCall("DELETE /forms/:formId", key.userId);

      const form = await findOwnedForm(params.formId, key.userId);
      if (!form) return status(404, { error: "Form not found" });

      await softDeleteForm(form.id);

      return { success: true, message: "Form deleted" };
    },
    { apiKey: true, params: t.Object({ formId: t.String() }), detail: hidden },
  )
  .get(
    "/:slug/submissions",
    async ({ key, params, status }) => {
      recordLegacyCall("GET /:slug/submissions", key.userId);

      // Addressed by slug, but this alias predates findFormBySlugForApiKey's
      // narrower projection, and it only needs the id.
      const forms = await listFormsForApiKey(key.userId);
      const form = forms.find((f) => f.slug === params.slug);
      if (!form) return status(404, { error: "Form not found" });

      // Unbounded, matching the old behaviour. /v1 paginates.
      const rows = await listAllSubmissionsForForm(form.id);

      return { submissions: rows.map(serializeSubmission) };
    },
    { apiKey: true, params: t.Object({ slug: t.String() }), detail: hidden },
  )
  .delete(
    "/:formId/submissions",
    async ({ key, params, body, status }) => {
      recordLegacyCall("DELETE /:formId/submissions", key.userId);

      const ids = body?.submissionIds;
      if (!Array.isArray(ids) || ids.length === 0) {
        return status(400, { error: "Invalid submission IDs" });
      }

      const form = await findOwnedForm(params.formId, key.userId);
      if (!form) return status(404, { error: "Form not found" });

      const owned = await findSubmissionsInForm(form.id, ids);
      if (owned.length !== ids.length) {
        return status(400, { error: "Invalid submission IDs" });
      }

      await softDeleteSubmissions(ids);

      return { success: true };
    },
    {
      apiKey: true,
      params: t.Object({ formId: t.String() }),
      // Loose on purpose: the old route validated the body by hand and
      // answered 400 with its own message, which callers may depend on.
      // A t.Object here would make Elysia answer first, with a different one.
      body: t.Optional(t.Any()),
      detail: hidden,
    },
  )
  .delete(
    "/:formId/submissions/:submissionId",
    async ({ key, params, status }) => {
      recordLegacyCall("DELETE /:formId/submissions/:submissionId", key.userId);

      const form = await findOwnedForm(params.formId, key.userId);
      if (!form) return status(404, { error: "Form not found" });

      const submission = await findSubmissionInForm(
        form.id,
        params.submissionId,
      );
      if (!submission || submission.deletedAt) {
        return status(404, { error: "Submission not found" });
      }

      await softDeleteSubmission(form.id, params.submissionId);

      return { success: true, message: "Submission deleted" };
    },
    {
      apiKey: true,
      params: t.Object({ formId: t.String(), submissionId: t.String() }),
      detail: hidden,
    },
  );
