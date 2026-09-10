/**
 * @formdrop/react -- React hooks for FormDrop (PRD W8).
 *
 * A thin layer over @formdrop/js, not a second client: the request, the
 * retries and the typed errors all come from there. This adds the state a
 * submit form needs and a wrapper that handles the boilerplate.
 *
 * The error classes are re-exported so a component can branch on what went
 * wrong without also installing @formdrop/js directly.
 */
export { useFormDrop } from "./use-form-drop.js";
export type {
  UseFormDropOptions,
  UseFormDropResult,
} from "./use-form-drop.js";

export { FormDropForm, HONEYPOT_FIELD } from "./form-drop-form.js";
export type { FormDropFormProps } from "./form-drop-form.js";

export {
  FormDropError,
  FormDropAuthError,
  FormDropForbiddenError,
  FormDropNotFoundError,
  FormDropValidationError,
  FormDropRateLimitError,
  FormDropServerError,
  FormDropNetworkError,
} from "@formdrop/js";

export type { SubmitResult, SubmissionInput } from "@formdrop/js";
