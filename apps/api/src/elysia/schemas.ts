import { t } from "elysia";

/**
 * Response shapes for the public API.
 *
 * Dates are declared as strings and mapped explicitly in the handlers rather
 * than handed over as Date objects. Express produced ISO strings because
 * res.json() serialises them that way, so declaring `t.String()` and calling
 * .toISOString() keeps the bytes identical *and* makes the contract say what
 * a caller actually receives -- which the SDKs will read off the OpenAPI spec.
 */
export const errorSchema = t.Object({ error: t.String() });

export const formSchema = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  slug: t.String(),
  description: t.Nullable(t.String()),
  createdAt: t.String({ format: "date-time" }),
});

export const submissionSchema = t.Object({
  id: t.String({ format: "uuid" }),
  formId: t.String({ format: "uuid" }),
  payload: t.Record(t.String(), t.Unknown()),
  ip: t.Nullable(t.String()),
  userAgent: t.Nullable(t.String()),
  createdAt: t.String({ format: "date-time" }),
});

/** A row as it leaves a handler: Dates already turned into ISO strings. */
export function serializeForm<
  T extends { createdAt: Date; description: string | null },
>(form: T) {
  return { ...form, createdAt: form.createdAt.toISOString() };
}

export function serializeSubmission<T extends { createdAt: Date }>(row: T) {
  return { ...row, createdAt: row.createdAt.toISOString() };
}
