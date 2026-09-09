import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Icon, Modal } from "@formdrop/ui";
import { Delete02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import moment from "moment";
// Derived from the query the handler calls. The local copy this replaces
// declared createdAt as a Date, which JSON never delivers.
import type { AdminForm } from "@/lib/app-client";
import { adminClient } from "@/lib/admin-client";
import { AdminTable } from "@/components/admin/admin-table";

/**
 * The cross-tenant forms table (PRD 4.6).
 *
 * The table itself is AdminTable, shared with the users screen -- the toolbar,
 * the sticky header, the sorting and the pagination are the same code, not a
 * second copy of it. What lives here is the columns and the delete flow.
 */
export const Route = createFileRoute("/(admin)/admin/forms")({
  component: AdminForms,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search?.page ?? 1),
    pageSize: Number(search?.pageSize ?? 10),
    sortBy: (search?.sortBy as string) ?? "createdAt",
    sortOrder: (search?.sortOrder as "asc" | "desc") ?? "desc",
    search: (search?.search as string) ?? "",
  }),
});

const columnHelper = createColumnHelper<AdminForm>();

function AdminForms() {
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const searchParams = Route.useSearch();
  const [deleting, setDeleting] = useState<AdminForm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: forms, isLoading } = useQuery({
    queryKey: ["admin", "forms"],
    queryFn: async () => {
      const response = await adminClient.forms();
      if ("error" in response) throw new Error(response.error);
      // No cast -- the type comes from the handler.
      return response.forms;
    },
  });

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await adminClient.deleteForm(deleting.id);
      if ("error" in response) {
        // Reported rather than swallowed. The version this replaces reloaded
        // the page whatever happened, so a failure looked exactly like a
        // success until you noticed the row was still there.
        setDeleteError(response.error);
        return;
      }
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "forms"] });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Form",
        size: 260,
        cell: (info) => (
          <div className="min-w-0">
            <div className="font-medium text-ink-950">{info.getValue()}</div>
            <div className="mt-0.5 font-mono text-xs text-ink-400">
              {info.row.original.id}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("userName", {
        header: "Owner",
        size: 170,
        cell: (info) => (
          // Stops the row handler underneath: the row opens the form, this
          // opens the account that owns it, and they are different places.
          <span onClick={(e) => e.stopPropagation()}>
            <Link
              to="/admin/users/$userId"
              params={{ userId: info.row.original.userId }}
              className="text-ink-600 underline decoration-ink-300 underline-offset-2 transition-colors hover:text-accent-600 hover:decoration-accent-500"
            >
              {info.getValue() || "Unknown"}
            </Link>
          </span>
        ),
      }),
      columnHelper.accessor("submissionCount", {
        header: "Submissions",
        size: 130,
        cell: (info) => (
          // A count is a number, not a status, so it reads as one -- the pill
          // this replaces implied a state the value does not have.
          <span className="font-medium text-ink-950 tabular-nums">
            {(info.getValue() ?? 0).toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        size: 130,
        cell: (info) => (
          <span className="whitespace-nowrap text-ink-500 tabular-nums">
            {moment(info.getValue()).format("MMM D, YYYY")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        size: 96,
        cell: (info) => {
          const form = info.row.original;
          return (
            <div
              className="flex items-center justify-end gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Link to="/app/forms/$id" params={{ id: form.id }}>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Open ${form.name}`}
                  icon={<Icon icon={ViewIcon} size={15} />}
                />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-tint-rose-ink hover:bg-tint-rose"
                onClick={() => setDeleting(form)}
                aria-label={`Delete ${form.name}`}
                icon={<Icon icon={Delete02Icon} size={15} />}
              />
            </div>
          );
        },
        enableSorting: false,
      }),
    ],
    [],
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          Forms
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Every form on the platform, and who owns it.
        </p>
      </div>

      <AdminTable
        tableId="admin-forms"
        data={forms ?? []}
        getRowId={(form) => form.id}
        // Every row here stacks a name over an id, so they are taller than the
        // single-line default. The virtualizer takes this as fact, not as a
        // starting guess, so it decides how tall the scrollbar is.
        rowHeight={65}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by form or owner"
        searchLabel="Search forms"
        emptyMessage={(query) =>
          query ? `No form matches "${query}".` : "No forms yet."
        }
        searchParams={searchParams}
        onSearchParamsChange={(next) =>
          navigate({ search: (prev) => ({ ...prev, ...next }) })
        }
        onRowClick={(form) =>
          navigate({ to: "/app/forms/$id", params: { id: form.id } })
        }
        rowLabel={(form) => `Open ${form.name}`}
      />

      <Modal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        label="Delete this form?"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-ink-950">
            Delete this form?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            <span className="font-medium text-ink-950">{deleting?.name}</span>{" "}
            and its {(deleting?.submissionCount ?? 0).toLocaleString()}{" "}
            submission
            {deleting?.submissionCount === 1 ? "" : "s"} belong to{" "}
            {deleting?.userName || "another account"}. Its endpoint stops
            accepting posts and this cannot be undone.
          </p>
          {deleteError && (
            <p className="mt-4 rounded-card border border-tint-rose bg-tint-rose/40 px-3 py-2 text-sm text-tint-rose-ink">
              {deleteError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleting(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={isDeleting}
            >
              Delete form
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
