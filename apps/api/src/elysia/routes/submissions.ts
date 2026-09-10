import { Elysia, t } from "elysia";
import { decodeCursor, encodeCursor, pageSize } from "@formdrop/core";
import {
  findFormBySlugForApiKey,
  findSubmissionInForm,
  findSubmissionsInForm,
  pageSubmissionsForForm,
  softDeleteSubmission,
  softDeleteSubmissions,
} from "@formdrop/core/data";
import { apiKeyAuth } from "../auth";
import { errorSchema, serializeSubmission, submissionSchema } from "../schemas";
import { rateLimitByApiKey } from "../rate-limit";

const FORM_NOT_FOUND = { error: "Form not found" };

export const submissionsV1 = new Elysia({
  prefix: "/v1/forms/:slug/submissions",
})
  .use(apiKeyAuth)
  .use(rateLimitByApiKey)
  .get(
    "",
    async ({ key, params, query, status }) => {
      const form = await findFormBySlugForApiKey(key.userId, params.slug);
      if (!form) return status(404, FORM_NOT_FOUND);

      const limit = pageSize(query.limit);

      // A cursor the caller mangled is their error, not a reason to silently
      // hand back page one -- which would look like the list restarting.
      const after = query.cursor ? decodeCursor(query.cursor) : null;
      if (query.cursor && !after) {
        return status(400, { error: "Invalid cursor" });
      }

      // One row beyond the page was fetched, so its presence is the answer to
      // "is there more?" -- it is trimmed off before returning.
      const rows = await pageSubmissionsForForm(form.id, {
        limit,
        after: after ?? undefined,
      });
      const hasMore = rows.length > limit;
      const data = (hasMore ? rows.slice(0, limit) : rows).map(
        serializeSubmission,
      );
      const last = hasMore ? rows[limit - 1] : undefined;

      return {
        data,
        nextCursor: last
          ? encodeCursor({ createdAt: last.createdAt, id: last.id })
          : null,
      };
    },
    {
      apiKey: true,
      params: t.Object({ slug: t.String() }),
      query: t.Object({
        limit: t.Optional(t.Numeric({ minimum: 1 })),
        cursor: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Submissions"],
        summary: "List submissions",
        description:
          "Cursor paginated, newest first. `limit` defaults to 50 and is " +
          "capped at 200. Pass the previous response's `nextCursor` to " +
          "continue; a null `nextCursor` means the last page.",
      },
      response: {
        200: t.Object({
          data: t.Array(submissionSchema),
          nextCursor: t.Nullable(t.String()),
        }),
        400: errorSchema,
        401: errorSchema,
        404: errorSchema,
      },
    },
  )
  .get(
    "/:id",
    async ({ key, params, status }) => {
      const form = await findFormBySlugForApiKey(key.userId, params.slug);
      if (!form) return status(404, FORM_NOT_FOUND);

      const submission = await findSubmissionInForm(form.id, params.id);
      if (!submission) return status(404, { error: "Submission not found" });

      return { submission: serializeSubmission(submission) };
    },
    {
      apiKey: true,
      params: t.Object({ slug: t.String(), id: t.String() }),
      detail: { tags: ["Submissions"], summary: "Get one submission" },
      response: {
        200: t.Object({ submission: submissionSchema }),
        401: errorSchema,
        404: errorSchema,
      },
    },
  )
  .delete(
    "",
    async ({ key, params, body, status }) => {
      const form = await findFormBySlugForApiKey(key.userId, params.slug);
      if (!form) return status(404, FORM_NOT_FOUND);

      // Every id must belong to this form, or nothing is deleted. Partial
      // success would leave the caller unable to tell what happened.
      const owned = await findSubmissionsInForm(form.id, body.ids);
      if (owned.length !== body.ids.length) {
        return status(400, { error: "Invalid submission IDs" });
      }

      await softDeleteSubmissions(body.ids);

      return { success: true };
    },
    {
      apiKey: true,
      params: t.Object({ slug: t.String() }),
      body: t.Object({ ids: t.Array(t.String(), { minItems: 1 }) }),
      detail: { tags: ["Submissions"], summary: "Delete submissions in bulk" },
      response: {
        200: t.Object({ success: t.Boolean() }),
        400: errorSchema,
        401: errorSchema,
        404: errorSchema,
      },
    },
  )
  .delete(
    "/:id",
    async ({ key, params, status }) => {
      const form = await findFormBySlugForApiKey(key.userId, params.slug);
      if (!form) return status(404, FORM_NOT_FOUND);

      const submission = await findSubmissionInForm(form.id, params.id);
      if (!submission || submission.deletedAt) {
        return status(404, { error: "Submission not found" });
      }

      await softDeleteSubmission(form.id, params.id);

      return { success: true, message: "Submission deleted" };
    },
    {
      apiKey: true,
      params: t.Object({ slug: t.String(), id: t.String() }),
      detail: { tags: ["Submissions"], summary: "Delete one submission" },
      response: {
        200: t.Object({ success: t.Boolean(), message: t.String() }),
        401: errorSchema,
        404: errorSchema,
      },
    },
  );
