import { apiRequest } from "./api/request";

import type { AdminStatsGetResponse } from "@/routes/api/admin/stats";
import type { AdminFormsGetResponse } from "@/routes/api/admin/forms";
import type { AdminSubmissionsGetResponse } from "@/routes/api/admin/submissions";
import type { AdminUsersUseridGetResponse } from "@/routes/api/admin/users/$userId";
import type { AdminSettingsClearOldSubmissionsPostResponse } from "@/routes/api/admin/settings/clear-old-submissions";

/**
 * The admin surface's client.
 *
 * The five admin pages each reached for axios directly and read `res.data`,
 * which is why axios survived app-client moving to fetch. Same shape as
 * appClient, same transport, and the response types come from the admin
 * handlers rather than being restated -- so the admin tables follow their
 * endpoints the way the dashboard's now do.
 *
 * This is plumbing, not the W4 redesign of these screens, which is still to
 * come (PRD 4.6).
 */
export const adminClient = {
  stats: () => apiRequest<AdminStatsGetResponse>("GET", "/api/admin/stats"),

  forms: () => apiRequest<AdminFormsGetResponse>("GET", "/api/admin/forms"),

  submissions: () =>
    apiRequest<AdminSubmissionsGetResponse>("GET", "/api/admin/submissions"),

  user: (userId: string) =>
    apiRequest<AdminUsersUseridGetResponse>(
      "GET",
      `/api/admin/users/${userId}`,
    ),

  clearOldSubmissions: () =>
    apiRequest<AdminSettingsClearOldSubmissionsPostResponse>(
      "POST",
      "/api/admin/settings/clear-old-submissions",
    ),
};
