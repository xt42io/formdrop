import axios from "axios";

const apiClient = axios.create({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  headers: {
    "Content-Type": "application/json",
  },
});

interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing" | "paused";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean | null;
}

interface Form {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  emailNotificationsEnabled: boolean;
  slackChannelName: string | null;
  slackTeamName: string | null;
  slackNotificationsEnabled: boolean;
  slackConnected: boolean;
  discordChannelName: string | null;
  discordGuildName: string | null;
  discordNotificationsEnabled: boolean;
  discordConnected: boolean;
  googleSheetsSpreadsheetId: string | null;
  googleSheetsSpreadsheetName: string | null;
  googleSheetsEnabled: boolean;
  googleSheetsConnected: boolean;
  airtableBaseName: string | null;
  airtableTableName: string | null;
  airtableEnabled: boolean;
  airtableConnected: boolean;
  allowedDomains: string[];
  createdAt: Date;
  updatedAt: Date;
  submissionCount?: number;
  slug: string;
}

interface Recipient {
  id: string;
  formId: string;
  email: string;
  enabled: boolean;
  verifiedAt: Date | null;
  verificationTokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Submission {
  id: string;
  formId: string;
  payload: Record<string, any>;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

interface ApiKey {
  id: string;
  userId: string;
  key: string;
  name: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

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
      apiCall<{ form: Form }>("post", "/api/forms", { data: params }),

    get: async (formId: string) =>
      apiCall<{ form: Form }>("get", `/api/forms/${formId}`),

    update: async (formId: string, params: UpdateFormParams) =>
      apiCall<{ form: Form }>("patch", `/api/forms/${formId}`, {
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
