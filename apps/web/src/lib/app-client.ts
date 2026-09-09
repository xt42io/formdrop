import { installMockData } from "./mock-data";

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

/**
 * What a value looks like after Response.json() and back.
 *
 * This matters: the handlers serialise Drizzle rows to JSON, so every Date
 * arrives as an ISO string. The hand-written types this file used to carry
 * declared them as `Date`, which was never true at runtime — the values were
 * always strings, and any caller that trusted the annotation and called a Date
 * method on one would have failed.
 */
type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

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

/**
 * The whole transport, on fetch.
 *
 * What this replaces was an axios instance plus a wrapper that hand-rolled the
 * same thing. `Serialized<T>` is applied here rather than inside each handler's
 * type because the Date-to-string conversion happens in transit, not in the
 * handler -- the handler really does hold Dates, and the client really does
 * receive strings.
 *
 * A non-2xx response is not thrown. Every handler answers errors as
 * `{ error }`, callers already narrow with `"error" in response`, and turning
 * half of a documented contract into an exception would mean rewriting all of
 * them for no gain.
 */
async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options?: { params?: Record<string, string | number>; body?: unknown },
): Promise<Serialized<T>> {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(options?.params ?? {})) {
    url.searchParams.set(key, String(value));
  }

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      // DELETE with a body is how the bulk endpoints are addressed; fetch
      // allows it, and the handlers read it.
      body:
        options?.body === undefined ? undefined : JSON.stringify(options.body),
    });

    // A handler that fell over before it could answer JSON -- a 502 from a
    // proxy, say -- would otherwise surface as an unreadable parse error.
    const text = await response.text();
    if (!text) {
      return { error: `Request failed (${response.status})` } as Serialized<T>;
    }
    return JSON.parse(text) as Serialized<T>;
  } catch {
    return { error: "An unexpected error occurred" } as Serialized<T>;
  }
}

// TEMPORARY, and the only two lines outside mock-data.ts that know about it.
// No-ops unless VITE_MOCK_DATA=1. Delete these and that file to remove it.
installMockData();

export const appClient = {
  forms: {
    list: () => request<FormsListResponse>("GET", "/api/forms"),

    create: (params: CreateFormParams) =>
      request<FormsCreateResponse>("POST", "/api/forms", { body: params }),

    get: (formId: string) =>
      request<FormsFormidGetResponse>("GET", `/api/forms/${formId}`),

    update: (formId: string, params: UpdateFormParams) =>
      request<FormsFormidPatchResponse>("PATCH", `/api/forms/${formId}`, {
        body: params,
      }),

    delete: (formId: string) =>
      request<FormsFormidDeleteResponse>("DELETE", `/api/forms/${formId}`),
  },

  recipients: {
    list: (formId: string) =>
      request<FormsFormidRecipientsGetResponse>(
        "GET",
        `/api/forms/${formId}/recipients`,
      ),

    add: (formId: string, email: string) =>
      request<FormsFormidRecipientsPostResponse>(
        "POST",
        `/api/forms/${formId}/recipients`,
        { body: { email } },
      ),

    remove: (formId: string, recipientId: string) =>
      request<FormsFormidRecipientsRecipientidDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/recipients/${recipientId}`,
      ),

    update: (formId: string, recipientId: string, enabled: boolean) =>
      request<FormsFormidRecipientsRecipientidPatchResponse>(
        "PATCH",
        `/api/forms/${formId}/recipients/${recipientId}`,
        { body: { enabled } },
      ),

    resendVerification: (formId: string, recipientId: string) =>
      request<FormsFormidRecipientsRecipientidResendVerificationPostResponse>(
        "POST",
        `/api/forms/${formId}/recipients/${recipientId}/resend-verification`,
      ),

    disconnectSlack: (formId: string) =>
      request<FormsFormidDisconnectSlackDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/disconnect-slack`,
      ),

    disconnectDiscord: (formId: string) =>
      request<FormsFormidDisconnectDiscordDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/disconnect-discord`,
      ),
  },

  submissions: {
    list: (formId: string, page = 1, limit = 50) =>
      request<FormsFormidSubmissionsGetResponse>(
        "GET",
        `/api/forms/${formId}/submissions`,
        { params: { page, limit } },
      ),

    get: (formId: string, submissionId: string) =>
      request<FormsFormidSubmissionsSubmissionidGetResponse>(
        "GET",
        `/api/forms/${formId}/submissions/${submissionId}`,
      ),

    delete: (formId: string, submissionId: string) =>
      request<FormsFormidSubmissionsSubmissionidDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/submissions/${submissionId}`,
      ),

    bulkDelete: (formId: string, submissionIds: string[]) =>
      request<FormsFormidSubmissionsDeleteResponse>(
        "DELETE",
        `/api/forms/${formId}/submissions`,
        { body: { submissionIds } },
      ),

    analytics: (formId: string) =>
      request<FormsFormidAnalyticsGetResponse>(
        "GET",
        `/api/forms/${formId}/analytics`,
      ),
  },

  apiKeys: {
    list: () => request<ApiKeysGetResponse>("GET", "/api/api-keys"),

    create: (params: CreateApiKeyParams) =>
      request<ApiKeysPostResponse>("POST", "/api/api-keys", { body: params }),

    delete: (params: DeleteApiKeyParams) =>
      request<ApiKeysDeleteResponse>("DELETE", "/api/api-keys", {
        body: params,
      }),
  },

  analytics: {
    get: () => request<AnalyticsGetResponse>("GET", "/api/analytics"),
  },

  subscription: {
    get: () => request<SubscriptionGetResponse>("GET", "/api/subscription"),
  },
};
