import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Button } from "@/components/button";
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin/submissions")({
  component: AdminSubmissions,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      page: Number(search?.page ?? 1),
      pageSize: Number(search?.pageSize ?? 10),
      sortBy: (search?.sortBy as string) ?? "createdAt",
      sortOrder: (search?.sortOrder as "asc" | "desc") ?? "desc",
      search: (search?.search as string) ?? "",
    };
  },
});

type Submission = {
  id: string;
  formId: string;
  formName: string;
  createdAt: Date;
  payload: any;
};

const columnHelper = createColumnHelper<Submission>();

const createColumns = () => [
  columnHelper.accessor("formName", {
    header: "Form",
    cell: (info) => (
      <div className="font-medium text-gray-900">{info.getValue()}</div>
    ),
    enableSorting: true,
  }),
  columnHelper.accessor("id", {
    header: "Submission ID",
    cell: (info) => (
      <div className="text-gray-500 font-mono text-xs">
        {info.getValue().substring(0, 8)}...
      </div>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("createdAt", {
    header: "Submitted",
    cell: (info) => (
      <div className="text-gray-500">
        {new Date(info.getValue()).toLocaleString()}
      </div>
    ),
    enableSorting: true,
  }),
  columnHelper.display({
    id: "preview",
    header: "Data Preview",
    cell: (info) => {
      const payload = info.row.original.payload;
      const preview = Object.keys(payload)
        .slice(0, 2)
        .map((key) => `${key}: ${payload[key]}`)
        .join(", ");
      return (
        <div className="text-gray-500 text-sm truncate max-w-xs">{preview}</div>
      );
    },
    enableSorting: false,
  }),
];

function AdminSubmissions() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();
  const [globalFilter, setGlobalFilter] = useState(searchParams.search);
  const [sorting, setSorting] = useState<SortingState>([
    { id: searchParams.sortBy, desc: searchParams.sortOrder === "desc" },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin", "submissions"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/submissions");
      return res.data.submissions as Submission[];
    },
  });

  const table = useReactTable({
    data: submissions || [],
    columns: createColumns(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: searchParams.page - 1,
        pageSize: searchParams.pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function"
          ? updater({
              pageIndex: searchParams.page - 1,
              pageSize: searchParams.pageSize,
            })
          : updater;

      navigate({
        search: (prev) => ({
          ...prev,
          page: newPagination.pageIndex + 1,
          pageSize: newPagination.pageSize,
        }),
      });
    },
  });

  // Update URL when sorting changes
  useEffect(() => {
    if (sorting.length > 0) {
      navigate({
        search: (prev) => ({
          ...prev,
          sortBy: sorting[0].id,
          sortOrder: sorting[0].desc ? "desc" : "asc",
        }),
      });
    }
  }, [sorting, navigate]);

  // Update URL when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          search: globalFilter,
          page: 1, // Reset to first page on search
        }),
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [globalFilter, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
          <p className="mt-1 text-sm text-gray-500">
            View all form submissions across the platform.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search submissions..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={searchParams.pageSize}
            onChange={(e) => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  pageSize: Number(e.target.value),
                  page: 1,
                }),
              });
            }}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "flex items-center space-x-1 cursor-pointer select-none hover:text-gray-700"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                          {header.column.getCanSort() && (
                            <span className="ml-1">
                              {header.column.getIsSorted() === "asc" ? (
                                <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <HugeiconsIcon
                                  icon={ArrowDown01Icon}
                                  size={14}
                                />
                              ) : (
                                <span className="text-gray-300">⇅</span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    No submissions found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {table.getRowModel().rows.length === 0
                  ? 0
                  : table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                    1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
              results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
