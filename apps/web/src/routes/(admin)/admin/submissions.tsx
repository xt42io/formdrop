import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import moment from "moment";
// Derived from the query the handler calls. The local copy this replaces
// typed payload as `any` and createdAt as a Date.
import type { AdminSubmission } from "@/lib/app-client";
import { adminClient } from "@/lib/admin-client";
import { AdminTable } from "@/components/admin/admin-table";

/**
 * The cross-tenant submissions table (PRD 4.6).
 *
 * AdminTable does the table; what is here is the columns. Third screen on the
 * shared one, which is the point of having extracted it.
 */
export const Route = createFileRoute("/(admin)/admin/submissions")({
  component: AdminSubmissions,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search?.page ?? 1),
    pageSize: Number(search?.pageSize ?? 10),
    sortBy: (search?.sortBy as string) ?? "createdAt",
    sortOrder: (search?.sortOrder as "asc" | "desc") ?? "desc",
    search: (search?.search as string) ?? "",
  }),
});

const columnHelper = createColumnHelper<AdminSubmission>();

/**
 * The first couple of fields, as one line.
 *
 * Payload keys vary per form, so there is no column set that fits every row --
 * which is why this is a preview rather than real columns, unlike the
 * account-facing submissions table where every row belongs to one form and
 * the keys can be derived.
 *
 * Values are coerced rather than interpolated: a payload value can be an
 * object or an array, and `${value}` on one of those prints "[object Object]".
 */
function previewOf(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .slice(0, 2)
    .map(([key, value]) => {
      const text =
        value === null || value === undefined
          ? "-"
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value);
      return `${key}: ${text}`;
    })
    .join(" · ");
}

function AdminSubmissions() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin", "submissions"],
    queryFn: async () => {
      const response = await adminClient.submissions();
      if ("error" in response) throw new Error(response.error);
      return response.submissions;
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor("formName", {
        header: "Form",
        size: 200,
        cell: (info) => (
          <span className="font-medium text-ink-950">
            {info.getValue() || "Unknown form"}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Received",
        size: 150,
        cell: (info) => (
          <span className="whitespace-nowrap text-ink-700 tabular-nums">
            {moment(info.getValue()).format("MMM D, h:mm A")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "preview",
        header: "Payload",
        size: 320,
        cell: (info) => (
          // A fixed ceiling rather than max-w-xs on an unbounded cell: the
          // table's columns are content-sized, so a long payload would
          // otherwise stretch this column and squeeze every other one.
          <span className="block max-w-[24rem] truncate text-ink-600">
            {previewOf(info.row.original.payload) || "Empty"}
          </span>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("id", {
        header: "ID",
        size: 280,
        cell: (info) => (
          // The whole id, not the first eight characters and an ellipsis --
          // a truncated id cannot be copied or searched for, which is the only
          // reason to show one. Hide it from the Columns menu if it is in the
          // way; that is what the menu is for.
          <span className="font-mono text-xs text-ink-500">
            {info.getValue()}
          </span>
        ),
        enableSorting: false,
      }),
    ],
    [],
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          Submissions
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          The most recent submissions across every form on the platform.
        </p>
      </div>

      <AdminTable
        tableId="admin-submissions"
        data={submissions ?? []}
        getRowId={(submission) => submission.id}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by form or payload"
        searchLabel="Search submissions"
        emptyMessage={(query) =>
          query ? `No submission matches "${query}".` : "No submissions yet."
        }
        searchParams={searchParams}
        onSearchParamsChange={(next) =>
          navigate({ search: (prev) => ({ ...prev, ...next }) })
        }
        onRowClick={(submission) =>
          navigate({
            to: "/app/forms/$id/submissions",
            params: { id: submission.formId },
          })
        }
        rowLabel={(submission) =>
          `Open ${submission.formName || "form"} submissions`
        }
      />
    </div>
  );
}
