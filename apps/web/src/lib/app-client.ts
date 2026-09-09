import { installMockData } from "./mock-data";
import { apiRequest, type Serialized } from "./api/request";

// Type-only imports, so nothing from packages/core/data (and therefore nothing
// from pg) reaches the browser bundle. These are erased at compile time.
import type {
  findFormDetailForUser,
  findSubscription,
  listAllFormsWithOwners,
  listApiKeysForUser,
  listFormsForUser,
  listRecentSubmissionsAcrossAllForms,
  listRecipientsForForm,
  listSubmissionsForForm,
} from "@formdrop/core/data";

// Also type-only, and the point of this file now: every response shape below
// is the one its handler actually returns, not a copy of it. Rename a key in a
// handler and the call site stops compiling.
import type {
  FormsListResponse,
  FormsCreateResponse,
} from "@/routes/api/forms";
import type {
  FormsFormidGetResponse,
  FormsFormidPatchResponse,
  FormsFormidDeleteResponse,
} from "@/routes/api/forms/$formId";
import type {
  FormsFormidRecipientsGetResponse,
  FormsFormidRecipientsPostResponse,
} from "@/routes/api/forms/$formId/recipients";
import type {
  FormsFormidRecipientsRecipientidDeleteResponse,
  FormsFormidRecipientsRecipientidPatchResponse,
} from "@/routes/api/forms/$formId/recipients/$recipientId";
import type { FormsFormidRecipientsRecipientidResendVerificationPostResponse } from "@/routes/api/forms/$formId/recipients/$recipientId/resend-verification";
import type { FormsFormidDisconnectSlackDeleteResponse } from "@/routes/api/forms/$formId/disconnect-slack";
import type { FormsFormidDisconnectDiscordDeleteResponse } from "@/routes/api/forms/$formId/disconnect-discord";
import type {
  FormsFormidSubmissionsGetResponse,
  FormsFormidSubmissionsDeleteResponse,
} from "@/routes/api/forms/$formId/submissions";
import type {
  FormsFormidSubmissionsSubmissionidGetResponse,
  FormsFormidSubmissionsSubmissionidDeleteResponse,
} from "@/routes/api/forms/$formId/submissions/$submissionId";
import type { FormsFormidAnalyticsGetResponse } from "@/routes/api/forms/$formId/analytics";
import type {
  ApiKeysGetResponse,
  ApiKeysPostResponse,
  ApiKeysDeleteResponse,
} from "@/routes/api/api-keys";
import type { AnalyticsGetResponse } from "@/routes/api/analytics";
import type { SubscriptionGetResponse } from "@/routes/api/subscription";

/** The awaited row type of a packages/core data function, as JSON. */
type Rows<T extends (...args: never[]) => unknown> = Serialized<
  Awaited<ReturnType<T>>
>;
type Row<T extends (...args: never[]) => unknown> = NonNullable<Rows<T>>;

/**
 * Entity shapes, derived rather than declared. Each one follows the query that
 * produces it, so adding a column to packages/core surfaces here instead of
 * silently drifting.
 *
 * These stay exported because components import them by name. They describe
 * the same rows the handler responses carry — this is the vocabulary, the
 * response types below are the contract.
 */
export type Form = Rows<typeof listFormsForUser>[number] & {
  recentUsage: { date: string; count: number }[];
};
export type FormDetail = Row<typeof findFormDetailForUser>;
export type Recipient = Rows<typeof listRecipientsForForm>[number];
export type Submission = Rows<typeof listSubmissionsForForm>[number];
export type ApiKey = Rows<typeof listApiKeysForUser>[number];
export type Subscription = Row<typeof findSubscription>;

/**
 * The admin tables read joined projections rather than plain rows -- a form
 * with its owner's name and submission count, a submission with its form's
 * name -- so they get their own derivations from the same queries.
 */
export type AdminForm = Rows<typeof listAllFormsWithOwners>[number];
export type AdminSubmission = Rows<
  typeof listRecentSubmissionsAcrossAllForms
>[number];

/**
 * Request bodies stay declared here. They describe what a caller may send, not
 * what the database holds, and the handlers accept a subset of the columns —
 * so deriving them from a row type would offer fields the API ignores.
 */
interface CreateFormParams {
  name: string;
  description?: string;
  allowedDomains?: string[];
}

interface UpdateFormParams {
  name?: string;
  description?: string;
  emailNotificationsEnabled?: boolean;
  slackNotificationsEnabled?: boolean;
  discordNotificationsEnabled?: boolean;
  googleSheetsEnabled?: boolean;
  airtableEnabled?: boolean;
  allowedDomains?: string[];
}

interface CreateApiKeyParams {
  name: string;
}

interface DeleteApiKeyParams {
  id: string;
}

// TEMPORARY, and the only two lines outside mock-data.ts that know about it.
// No-ops unless VITE_MOCK_DATA=1. Delete these and that file to remove it.
installMockData();

export const appClient = {
  forms: {
    list: () => apiRequest<FormsListResponse>("GET", "/api/forms"),

    create: (params: CreateFormParams) =>
      apiRequest<FormsCreateResponse>("POST", "/api/forms", { body: params }),

    get: (formId: string) =>
      apiRequest<FormsFormidGetResponse>("GET", `/api/forms/${formId}`),

    update: (formId: string, params: UpdateFormParams) =>
      apiRequest<FormsFormidPatchResponse>("PATCH", `/api/forms/${formId}`, {
        body: params,
      }),

    delete: (formId: string) =>
      apiRequest<FormsFormidDeleteResponse>("DELETE", `/api/forms/${formId}`),
  },

  recipients: {
    list: (formId: string) =>
      apiRequest<FormsFormidRecipientsGetResponse>(
        "GET",
        `/api/forms/${formId}/recipients`,
      ),

    add: (formId: string, email: string) =>
      apiRequest<FormsFormidRecipientsPostResponse>(
        "POST",
        `/api/forms/${formId}/recipients`,
        { body: { email } },
      ),

    remove: (formId: string, recipientId: string) =>
      apiRequest<FormsFormidRecipientsRecipientidDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/recipients/${recipientId}`,
      ),

    update: (formId: string, recipientId: string, enabled: boolean) =>
      apiRequest<FormsFormidRecipientsRecipientidPatchResponse>(
        "PATCH",
        `/api/forms/${formId}/recipients/${recipientId}`,
        { body: { enabled } },
      ),

    resendVerification: (formId: string, recipientId: string) =>
      apiRequest<FormsFormidRecipientsRecipientidResendVerificationPostResponse>(
        "POST",
        `/api/forms/${formId}/recipients/${recipientId}/resend-verification`,
      ),

    disconnectSlack: (formId: string) =>
      apiRequest<FormsFormidDisconnectSlackDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/disconnect-slack`,
      ),

    disconnectDiscord: (formId: string) =>
      apiRequest<FormsFormidDisconnectDiscordDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/disconnect-discord`,
      ),
  },

  submissions: {
    list: (formId: string, page = 1, limit = 50) =>
      apiRequest<FormsFormidSubmissionsGetResponse>(
        "GET",
        `/api/forms/${formId}/submissions`,
        { params: { page, limit } },
      ),

    get: (formId: string, submissionId: string) =>
      apiRequest<FormsFormidSubmissionsSubmissionidGetResponse>(
        "GET",
        `/api/forms/${formId}/submissions/${submissionId}`,
      ),

    delete: (formId: string, submissionId: string) =>
      apiRequest<FormsFormidSubmissionsSubmissionidDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/submissions/${submissionId}`,
      ),

    bulkDelete: (formId: string, submissionIds: string[]) =>
      apiRequest<FormsFormidSubmissionsDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/submissions`,
        { body: { submissionIds } },
      ),

    analytics: (formId: string) =>
      apiRequest<FormsFormidAnalyticsGetResponse>(
        "GET",
        `/api/forms/${formId}/analytics`,
      ),
  },

  apiKeys: {
    list: () => apiRequest<ApiKeysGetResponse>("GET", "/api/api-keys"),

    create: (params: CreateApiKeyParams) =>
      apiRequest<ApiKeysPostResponse>("POST", "/api/api-keys", {
        body: params,
      }),

    delete: (params: DeleteApiKeyParams) =>
      apiRequest<ApiKeysDeleteResponse>("DELETE", "/api/api-keys", {
        body: params,
      }),
  },

  analytics: {
    get: () => apiRequest<AnalyticsGetResponse>("GET", "/api/analytics"),
  },

  subscription: {
    get: () => apiRequest<SubscriptionGetResponse>("GET", "/api/subscription"),
  },
};
