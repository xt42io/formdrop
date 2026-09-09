import { useEffect, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";

/**
 * The cross-tenant table (PRD 4.6).
 *
 * The table is DataTable, shared with the account submissions screen -- the
 * virtualized body, the sticky header, the columns menu, the keyboard
 * navigation and the fixed layout are one piece of code now, which is what 4.6
 * asks for: "the same virtualization and column controls as the user-facing
 * versions, reusing the same components".
 *
 * What is left here is the part that is only true of the admin screens. Their
 * state lives in the URL, so a sorted and filtered view can be linked and
 * survives a reload. That is a routing concern rather than a table one, and
 * pushing it into the shared component would have meant teaching it about
 * TanStack Router for the benefit of half its callers.
 */
export interface AdminTableSearch {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search: string;
}

export interface AdminTableProps<T> {
  /**
   * Namespaces the hidden-columns preference. Each table remembers its own --
   * hiding "Payload" on submissions should not hide anything on forms.
   */
  tableId: string;
  data: T[];
  // `any` is TanStack's own column value type; narrowing it here would mean
  // every caller declaring a union of its cell types for no gain.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  /** Identifies a row for React keys and for the virtualizer. */
  getRowId: (row: T) => string;
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
  /** A table whose cells draw two lines has taller rows and must say so. */
  rowHeight?: number;
}

export function AdminTable<T>({
  tableId,
  data,
  columns,
  getRowId,
  isLoading,
  searchPlaceholder,
  searchLabel,
  emptyMessage,
  searchParams,
  onSearchParamsChange,
  onRowClick,
  rowLabel,
  rowHeight,
}: AdminTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState(searchParams.search);
  const [sorting, setSorting] = useState<SortingState>([
    { id: searchParams.sortBy, desc: searchParams.sortOrder === "desc" },
  ]);

  /*
   * Mirror sorting into the URL, so a sorted view can be linked.
   *
   * The guard is the whole point. Both of these effects run on mount, and on
   * mount the state they are mirroring was initialised *from* the URL -- so
   * without it they push a history entry describing the page you are already
   * on. Landing on the users table cost four entries between them, which meant
   * four presses of Back to leave a page you had visited once.
   */
  useEffect(() => {
    if (sorting.length === 0) return;

    const sortBy = sorting[0].id;
    const sortOrder = sorting[0].desc ? "desc" : "asc";
    if (
      sortBy === searchParams.sortBy &&
      sortOrder === searchParams.sortOrder
    ) {
      return;
    }

    onSearchParamsChange({ sortBy, sortOrder });
    // Deliberately keyed on sorting alone: onSearchParamsChange is rebuilt
    // every render by the caller's navigate closure, so depending on it would
    // loop.
  }, [sorting]);

  // Debounced, because this runs on every keystroke and each one is a
  // navigation. Same no-op guard, for the same reason.
  useEffect(() => {
    if ((globalFilter ?? "") === searchParams.search) return;

    const timer = setTimeout(() => {
      onSearchParamsChange({ search: globalFilter, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
    // Keyed on globalFilter alone, for the same reason as above.
  }, [globalFilter]);

  return (
    <DataTable
      tableId={tableId}
      data={data}
      columns={columns}
      getRowId={getRowId}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      search={{
        value: globalFilter,
        onChange: setGlobalFilter,
        placeholder: searchPlaceholder,
        label: searchLabel,
      }}
      sorting={sorting}
      onSortingChange={setSorting}
      paging={{
        mode: "pages",
        pageIndex: searchParams.page - 1,
        pageSize: searchParams.pageSize,
        onPaginationChange: (next) =>
          onSearchParamsChange({
            page: next.pageIndex + 1,
            pageSize: next.pageSize,
          }),
      }}
      onRowActivate={onRowClick}
      rowLabel={rowLabel}
      rowRole="link"
      rowHeight={rowHeight}
    />
  );
}
