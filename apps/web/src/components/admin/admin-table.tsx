import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { Button, Icon, Select } from "@formdrop/ui";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";

/**
 * The cross-tenant table (PRD 4.6).
 *
 * The users, forms and submissions screens are the same table three times over
 * -- same TanStack setup, same toolbar, same sticky header, same pagination
 * footer, same URL mirroring. They were three copies, and the second one had
 * already drifted from the first. This is the one.
 *
 * 4.6 asks for these to reuse the same components as the user-facing versions.
 * They are not there yet: the account submissions table is virtualized and
 * carries column controls, and this is neither. What this does is stop the
 * three admin tables from diverging any further while that lands, which is the
 * precondition for replacing all three at once rather than one at a time.
 */
export interface AdminTableSearch {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search: string;
}

export interface AdminTableProps<T> {
  data: T[];
  // `any` is TanStack's own column value type; narrowing it here would mean
  // every caller declaring a union of its cell types for no gain.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  isLoading: boolean;
  searchPlaceholder: string;
  /** Names the search box for assistive tech, e.g. "Search forms". */
  searchLabel: string;
  /** What to say when there is nothing to show, filtered or otherwise. */
  emptyMessage: (query: string) => string;
  searchParams: AdminTableSearch;
  onSearchParamsChange: (next: Partial<AdminTableSearch>) => void;
  /** Makes the whole row navigate. Action cells must stop propagation. */
  onRowClick?: (row: T) => void;
  /** What the row announces to a screen reader when it is clickable. */
  rowLabel?: (row: T) => string;
}

export function AdminTable<T>({
  data,
  columns,
  isLoading,
  searchPlaceholder,
  searchLabel,
  emptyMessage,
  searchParams,
  onSearchParamsChange,
  onRowClick,
  rowLabel,
}: AdminTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState(searchParams.search);
  const [sorting, setSorting] = useState<SortingState>([
    { id: searchParams.sortBy, desc: searchParams.sortOrder === "desc" },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
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
      const next =
        typeof updater === "function"
          ? updater({
              pageIndex: searchParams.page - 1,
              pageSize: searchParams.pageSize,
            })
          : updater;
      onSearchParamsChange({
        page: next.pageIndex + 1,
        pageSize: next.pageSize,
      });
    },
  });

  // Mirror sorting into the URL, so a sorted view can be linked.
  useEffect(() => {
    if (sorting.length === 0) return;
    onSearchParamsChange({
      sortBy: sorting[0].id,
      sortOrder: sorting[0].desc ? "desc" : "asc",
    });
    // onSearchParamsChange is rebuilt each render by the caller's navigate
    // closure; depending on it would loop.
    // eslint-disable-next-line
  }, [sorting]);

  // Debounced, because this runs on every keystroke and each one is a
  // navigation.
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchParamsChange({ search: globalFilter, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [globalFilter]);

  if (isLoading) {
    return (
      <div className="mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
        <div className="border-b border-ink-100 px-4 py-3">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-ink-100" />
        </div>
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b border-ink-100 px-4 py-4 last:border-b-0"
          >
            <div className="h-4 w-40 animate-pulse rounded bg-ink-100" />
            <div className="h-4 w-52 animate-pulse rounded bg-ink-100" />
            <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-ink-100" />
          </div>
        ))}
      </div>
    );
  }

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const firstShown = rows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const lastShown = Math.min((pageIndex + 1) * pageSize, filteredCount);

  return (
    <div className="animate-enter-late mt-6 overflow-hidden rounded-panel border border-ink-200 bg-white">
      {/* Controls live in the panel's own header, the way the submissions
          table carries its column menu, rather than in a separate card
          floating above it. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
        {/* Sized to its content rather than stretched across the panel. A
            search box does not become more useful at 700px, and a full-width
            one reads as the primary thing on a screen whose primary thing is
            the table. */}
        <input
          type="search"
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full min-w-0 rounded-xl border border-ink-200 px-3 py-1.5 text-sm text-ink-950 transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none sm:w-64"
        />
        <Select
          label="Rows per page"
          value={searchParams.pageSize}
          options={[10, 25, 50, 100].map((n) => ({
            value: n,
            label: `${n} per page`,
          }))}
          onChange={(nextSize) =>
            onSearchParamsChange({ pageSize: nextSize, page: 1 })
          }
          className="w-auto shrink-0"
        />
      </div>

      {/* Grows with the rows up to a ceiling, then scrolls -- the same
          treatment the forms list has. 26rem rather than the submissions
          table's 32rem, because this panel also carries a toolbar and a
          pagination footer. */}
      <div className="max-h-[26rem] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-ink-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-ink-200">
                {headerGroup.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        !sortable || !sorted
                          ? undefined
                          : sorted === "asc"
                            ? "ascending"
                            : "descending"
                      }
                      className="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-ink-500 uppercase"
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex cursor-pointer items-center gap-1 rounded transition-colors hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {/* An icon rather than the "⇅" character these
                              tables used -- that rendered at whatever the
                              system font felt like and sat off the
                              baseline. */}
                          <Icon
                            icon={
                              sorted === "asc"
                                ? ArrowUp01Icon
                                : sorted === "desc"
                                  ? ArrowDown01Icon
                                  : UnfoldMoreIcon
                            }
                            size={13}
                            className={
                              sorted ? "text-accent-600" : "text-ink-300"
                            }
                          />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-ink-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  <p className="text-center text-sm text-ink-500">
                    {emptyMessage(globalFilter ?? "")}
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const clickable = Boolean(onRowClick);
                return (
                  /*
                   * The whole row can open its record, so every cell is live,
                   * not just a small icon at the end of it.
                   *
                   * A <tr> cannot be wrapped in a link, and a stretched
                   * overlay inside a table cell does not position reliably, so
                   * this is a click handler with a keyboard equivalent. Action
                   * cells stop propagation, or a delete would also navigate.
                   */
                  <tr
                    key={row.id}
                    tabIndex={clickable ? 0 : undefined}
                    role={clickable ? "link" : undefined}
                    aria-label={
                      clickable ? rowLabel?.(row.original) : undefined
                    }
                    onClick={
                      clickable ? () => onRowClick?.(row.original) : undefined
                    }
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick?.(row.original);
                            }
                          }
                        : undefined
                    }
                    className={`transition-colors hover:bg-accent-500/4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset ${
                      clickable ? "cursor-pointer" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-4 py-3">
        <p className="text-xs text-ink-500 tabular-nums">
          {filteredCount === 0
            ? "No results"
            : `${firstShown}-${lastShown} of ${filteredCount.toLocaleString()}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-xs text-ink-500 tabular-nums">
            Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
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
  );
}
