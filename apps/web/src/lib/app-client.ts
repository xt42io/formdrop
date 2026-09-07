import axios from "axios";

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

const apiClient = axios.create({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * What a value looks like after Response.json() and back.
 *
 * This matters: the handlers serialise Drizzle rows to JSON, so every Date
 * arrives as an ISO string. The previous hand-written types in this file
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
 * silently drifting — which is what W3 asks for: no component re-declaring a
 * type that packages/db or packages/core already knows.
 */
export type Form = Rows<typeof listFormsForUser>[number];
export type FormDetail = Row<typeof findFormDetailForUser>;
export type Recipient = Rows<typeof listRecipientsForForm>[number];
export type Submission = Rows<typeof listSubmissionsForForm>[number];
export type ApiKey = Rows<typeof listApiKeysForUser>[number];
export type Subscription = Row<typeof findSubscription>;

/**
 * The admin tables read joined projections rather than plain rows -- a form
 * with its owner's name and submission count, a submission with its form's
 * name -- so they get their own derivations from the same queries.
 *
 * Both were declared by hand in the route files, and both declared createdAt
 * as a Date, which it is not once the handler has serialised it.
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

type SuccessResponse<T> = T;
type ErrorResponse = { error: string; details?: string };
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Helper function to handle API calls with consistent error handling
async function apiCall<T = any>(
  method: "get" | "post" | "patch" | "delete",
  url: string,
  options?: { params?: any; data?: any },
): Promise<ApiResponse<T>> {
  try {
    let response;
    if (method === "get" || method === "delete") {
      response = await apiClient[method](url, {
        params: options?.params,
        data: options?.data,
      });
    } else {
      response = await apiClient[method](url, options?.data, {
        params: options?.params,
      });
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    return { error: "An unexpected error occurred" };
  }
}

export const appClient = {
  forms: {
    list: async () => apiCall<{ forms: Form[] }>("get", "/api/forms"),

    create: async (params: CreateFormParams) =>
      apiCall<{ form: FormDetail }>("post", "/api/forms", { data: params }),

    get: async (formId: string) =>
      apiCall<{ form: FormDetail }>("get", `/api/forms/${formId}`),

    update: async (formId: string, params: UpdateFormParams) =>
      apiCall<{ form: FormDetail }>("patch", `/api/forms/${formId}`, {
        data: params,
      }),

    delete: async (formId: string) =>
      apiCall<{ message: string }>("delete", `/api/forms/${formId}`),
  },

  recipients: {
    list: async (formId: string) =>
      apiCall<{ recipients: Recipient[] }>(
        "get",
        `/api/forms/${formId}/recipients`,
      ),

    add: async (formId: string, email: string) =>
      apiCall<{ recipient: Recipient }>(
        "post",
        `/api/forms/${formId}/recipients`,
        { data: { email } },
      ),

    remove: async (formId: string, recipientId: string) =>
      apiCall<{ success: boolean }>(
        "delete",
        `/api/forms/${formId}/recipients/${recipientId}`,
      ),

    update: async (formId: string, recipientId: string, enabled: boolean) =>
      apiCall<{ recipient: Recipient }>(
        "patch",
        `/api/forms/${formId}/recipients/${recipientId}`,
        { data: { enabled } },
      ),

    resendVerification: async (formId: string, recipientId: string) =>
      apiCall<{ success: boolean }>(
        "post",
        `/api/forms/${formId}/recipients/${recipientId}/resend-verification`,
      ),

    disconnectSlack: async (formId: string) =>
      apiCall<{ success: boolean }>(
        "delete",
        `/api/forms/${formId}/disconnect-slack`,
      ),

    disconnectDiscord: async (formId: string) =>
      apiCall<{ success: boolean }>(
        "delete",
        `/api/forms/${formId}/disconnect-discord`,
      ),
  },

  submissions: {
    list: async (formId: string, page = 1, limit = 50) =>
      apiCall<{
        submissions: Submission[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>("get", `/api/forms/${formId}/submissions`, {
        params: { page, limit },
      }),

    get: async (formId: string, submissionId: string) =>
      apiCall<{ submission: Submission }>(
        "get",
        `/api/forms/${formId}/submissions/${submissionId}`,
      ),

    delete: async (formId: string, submissionId: string) =>
      apiCall<{ message: string }>(
        "delete",
        `/api/forms/${formId}/submissions/${submissionId}`,
      ),

    bulkDelete: async (formId: string, submissionIds: string[]) =>
      apiCall<{ success: boolean }>(
        "delete",
        `/api/forms/${formId}/submissions`,
        { data: { submissionIds } },
      ),

    // Chart series are assembled by the handler rather than returned by a
    // query, so these shapes are the handler's and have nothing in
    // packages/core to derive from.
    analytics: async (formId: string) =>
      apiCall<{
        stats: { total: number; thisMonth: number; today: number };
        chartData: { date: string; submissions: number }[];
      }>("get", `/api/forms/${formId}/analytics`),
  },

  apiKeys: {
    list: async () => apiCall<{ keys: ApiKey[] }>("get", "/api/api-keys"),

    create: async (params: CreateApiKeyParams) =>
      apiCall<{ key: ApiKey }>("post", "/api/api-keys", { data: params }),

    delete: async (params: DeleteApiKeyParams) =>
      apiCall<{ success: boolean }>("delete", "/api/api-keys", {
        data: params,
      }),
  },

  analytics: {
    get: async () =>
      apiCall<{
        stats: {
          totalForms: number;
          totalSubmissions: number;
          submissionsThisMonth: number;
        };
        chartData: { date: string; submissions: number }[];
        topForms: { id: string; name: string; submissionCount: number }[];
      }>("get", "/api/analytics"),
  },

  subscription: {
    get: async () =>
      apiCall<{ subscription: Subscription | null }>(
        "get",
        "/api/subscription",
      ),
  },
};
