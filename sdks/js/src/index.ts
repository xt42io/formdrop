/**
 * @formdrop/js -- the official FormDrop client (PRD W8).
 *
 * Zero dependencies, ESM and CJS, browser and Node. The two entry points
 * mirror the two audiences: `FormDrop.submit` is the unauthenticated call a
 * form on a website makes, and `new FormDrop({ apiKey })` is the server-side
 * client that reads data back.
 */
export { FormDrop, DEFAULT_BASE_URL } from "./client.js";

export {
  FormDropError,
  FormDropAuthError,
  FormDropForbiddenError,
  FormDropNotFoundError,
  FormDropValidationError,
  FormDropRateLimitError,
  FormDropServerError,
  FormDropNetworkError,
} from "./errors.js";

export type {
  Form,
  Submission,
  SubmissionPage,
  SubmitResult,
  SubmissionInput,
  FormDropOptions,
  RequestOptions,
  ListSubmissionsOptions,
} from "./types.js";
