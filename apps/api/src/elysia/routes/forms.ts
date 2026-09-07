import { Elysia, t } from "elysia";
import {
  createForm,
  findFormBySlugForApiKey,
  findLiveFormByName,
  listFormsForApiKey,
  softDeleteForm,
} from "@formdrop/core/data";
import { apiKeyAuth } from "../auth";
import { errorSchema, formSchema, serializeForm } from "../schemas";

/**
 * /v1/forms.
 *
 * No CORS plugin here, deliberately -- see ../cors. These take an API key, so
 * they are server-to-server calls, and a browser has no business reaching them
 * cross-origin.
 */
export const formsV1 = new Elysia({ prefix: "/v1/forms" })
  .use(apiKeyAuth)
  .get(
    "",
    async ({ key }) => ({
      forms: (await listFormsForApiKey(key.userId)).map(serializeForm),
    }),
    {
      apiKey: true,
      detail: { tags: ["Forms"], summary: "List forms" },
      response: {
        200: t.Object({ forms: t.Array(formSchema) }),
        401: errorSchema,
      },
    },
  )
  .post(
    "",
    async ({ key, body, status }) => {
      // The schema has a unique index on (userId, name) for live rows, so a
      // duplicate would surface as a database error. Checking first turns that
      // into an answer the caller can act on.
      const existing = await findLiveFormByName(key.userId, body.name);
      if (existing) {
        return status(409, { error: "A form with that name already exists" });
      }

      const form = await createForm({
        userId: key.userId,
        name: body.name,
        description: body.description ?? null,
        allowedDomains: body.allowedDomains ?? [],
      });

      return status(201, { form: serializeForm(form) });
    },
    {
      apiKey: true,
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 200 }),
        description: t.Optional(t.Nullable(t.String({ maxLength: 2000 }))),
        allowedDomains: t.Optional(t.Array(t.String())),
      }),
      detail: { tags: ["Forms"], summary: "Create a form" },
      response: {
        201: t.Object({ form: formSchema }),
        401: errorSchema,
        409: errorSchema,
      },
    },
  )
  .get(
    "/:slug",
    async ({ key, params, status }) => {
      const form = await findFormBySlugForApiKey(key.userId, params.slug);
      if (!form) return status(404, { error: "Form not found" });

      return { form: serializeForm(form) };
    },
    {
      apiKey: true,
      params: t.Object({ slug: t.String() }),
      detail: { tags: ["Forms"], summary: "Get a form by slug" },
      response: {
        200: t.Object({ form: formSchema }),
        401: errorSchema,
        404: errorSchema,
      },
    },
  )
  .delete(
    "/:slug",
    async ({ key, params, status }) => {
      const form = await findFormBySlugForApiKey(key.userId, params.slug);
      if (!form) return status(404, { error: "Form not found" });

      await softDeleteForm(form.id);

      return { success: true, message: "Form deleted" };
    },
    {
      apiKey: true,
      params: t.Object({ slug: t.String() }),
      detail: { tags: ["Forms"], summary: "Delete a form" },
      response: {
        200: t.Object({ success: t.Boolean(), message: t.String() }),
        401: errorSchema,
        404: errorSchema,
      },
    },
  );
