import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button, Icon, Select } from "@formdrop/ui";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Loading03Icon,
  Tick02Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { ColumnsMenu } from "./columns-menu";
import {
  readHidden,
  toHiddenList,
  toVisibilityState,
  writeHidden,
} from "./column-prefs";

/**
 * The table (PRD 4.5 and 4.6).
 *
 * 4.6 asks the admin tables to carry "the same virtualization and column
 * controls as the user-facing versions, reusing the same components". They did
 * not: the account submissions table was a hand-rolled virtualized table and
 * the admin screens were a paginated TanStack one, and between them they had
 * two column menus, two ideas about keyboard navigation and two row heights.
 * This is the component both are now made of.
 *
 * What is shared is everything structural -- the scroll container and its
 * ceiling, the sticky header and its sort affordance, fixed layout, the
 * virtualized body, roving-tabindex keyboard navigation, selection, the
 * columns menu and its persistence. What is left to the callers is the two
 * things that genuinely differ: where the columns come from, and how more rows
 * arrive.
 *
 * Paging is a discriminated union rather than a handful of optional props,
 * because pages and infinite scroll are exclusive: a table handed both, or
 * neither, has no defined behaviour, and this way that cannot be expressed.
 */
export type DataTablePaging =
  | {
      mode: "pages";
      pageIndex: number;
      pageSize: number;
      pageSizeOptions?: number[];
      onPaginationChange: (next: {
        pageIndex: number;
        pageSize: number;
      }) => void;
    }
  | {
      mode: "infinite";
      /**
       * Called when the reader reaches the end of what is loaded.
       *
       * A sentinel row watched by an IntersectionObserver cannot work here:
       * with virtualization the last row is not in the DOM until you scroll to
       * it, so the observer would have nothing to see. The virtualizer already
       * knows which rows it is rendering, so the last index is the signal.
       */
      onEndReached: () => void;
      isFetchingNextPage?: boolean;
    };

export interface DataTableSelection<T> {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  selectAllLabel: string;
  selectRowLabel: (row: T) => string;
}

export interface DataTableProps<T> {
  /** Namespaces the hidden-column preference. Each table remembers its own. */
  tableId: string;
  /**
   * Overrides where that preference is stored. Only for a table that had one
   * before this component existed and should not forget it.
   */
  prefsKey?: string;
  data: T[];
  // `any` is TanStack's own column value type; narrowing it here would mean
  // every caller declaring a union of its cell types for no gain.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  getRowId: (row: T) => string;

  isLoading?: boolean;
  /** What to say when there is nothing to show, filtered or otherwise. */
  emptyMessage?: (query: string) => string;

  /** Turns on the search box and drives the global filter from it. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    label: string;
  };
  /** Sits where the search box would, for a table that does not have one. */
  summary?: ReactNode;
  /**
   * Extra toolbar controls, handed the hidden columns so a saved-views menu
   * can both read the layout on screen and replace it.
   */
  toolbar?: (context: {
    hidden: string[];
    setHidden: (next: string[]) => void;
  }) => ReactNode;
  /** Names the column list, e.g. "Payload fields". */
  columnsHeading?: string;
  columnsMonospace?: boolean;

  sorting?: SortingState;
  onSortingChange?: (next: SortingState) => void;

  paging: DataTablePaging;
  selection?: DataTableSelection<T>;

  onRowActivate?: (row: T) => void;
  /** What a clickable row announces to a screen reader. */
  rowLabel?: (row: T) => string;
  /** A row that navigates is a link; a row that opens a drawer is not. */
  rowRole?: "link";

  /**
   * The height of one row, in pixels. Not an estimate the virtualizer will
   * correct -- see the note by useVirtualizer -- so a table whose cells draw
   * two lines has to say so, or its scrollbar describes a shorter list than
   * the one underneath it.
   */
  rowHeight?: number;
  /**
   * A note under the table, e.g. how many columns are hidden. Handed the same
   * hidden list the toolbar gets: reading the preference separately would let
   * the note describe a layout the menu had already changed.
   */
  footNote?: (context: { hidden: string[] }) => ReactNode;
  /**
   * The panel's outer spacing. A prop rather than a class the caller can
   * append, because there is no tailwind-merge here: an appended `mt-3` and a
   * built-in `mt-6` have equal specificity and the stylesheet order decides,
   * which means the larger one silently wins whatever the caller asked for.
   */
  className?: string;
}

/**
 * Marks a column whose header is a literal identifier rather than a label we
 * chose -- a payload field name. Those are shown as written, in mono, because
 * uppercasing `email` into `EMAIL` renames the form's own field on screen.
 */
export interface DataTableColumnMeta {
  identifierHeader?: boolean;
}

const SELECT_COLUMN_ID = "__select";
const SELECT_W = 44;

function RoundCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    // Block-level, not inline-flex. An inline box sits on the cell's text
    // baseline, and the line box's descender space carried the control about
    // 2.7px above the row's centre; as a block the cell's own
    // vertical-align: middle centres it.
    <label className="relative flex cursor-pointer items-center">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={`flex size-4 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent-500 peer-focus-visible:ring-offset-1 ${
          checked
            ? "border-accent-500 bg-accent-500 text-white"
            : "border-ink-300 bg-white"
        }`}
      >
        {checked && <Icon icon={Tick02Icon} size={10} />}
      </span>
    </label>
  );
}

function LoadingSkeleton({ className }: { className: string }) {
  return (
    <div
      className={`overflow-hidden rounded-panel border border-ink-200 bg-white ${className}`}
    >
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

export function DataTable<T>({
  tableId,
  prefsKey,
  data,
  columns,
  getRowId,
  isLoading = false,
  emptyMessage,
  search,
  summary,
  toolbar,
  columnsHeading,
  columnsMonospace = false,
  sorting,
  onSortingChange,
  paging,
  selection,
  onRowActivate,
  rowLabel,
  rowRole,
  rowHeight = 45,
  footNote,
  className = "mt-6",
}: DataTableProps<T>) {
  const storageKey = prefsKey ?? `formdrop:table-columns:${tableId}`;
  const [hidden, setHiddenState] = useState<string[]>([]);

  // Read in an effect, not during render: this is localStorage and the server
  // has none, so reading inline would hydrate-mismatch for anyone who has
  // hidden a column.
  useEffect(() => {
    setHiddenState(readHidden(storageKey));
  }, [storageKey]);

  const setHidden = useCallback(
    (next: string[]) => {
      setHiddenState(next);
      writeHidden(storageKey, next);
    },
    [storageKey],
  );

  /*
   * The selection column is built here rather than declared by each caller.
   *
   * It is the same column every time -- a checkbox keyed on the row id, and a
   * select-all in the header -- so leaving it to callers would be a chance for
   * each to render it slightly differently, and it has to agree with the
   * keyboard handling further down, which lives here.
   */
  const allColumns = useMemo(() => {
    if (!selection) return columns;

    const allSelected =
      data.length > 0 && selection.selectedIds.length === data.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectColumn: ColumnDef<T, any> = {
      id: SELECT_COLUMN_ID,
      size: SELECT_W,
      enableSorting: false,
      enableHiding: false,
      header: () => (
        <RoundCheckbox
          label={selection.selectAllLabel}
          checked={allSelected}
          onChange={selection.onToggleAll}
        />
      ),
      cell: ({ row }) => (
        <RoundCheckbox
          label={selection.selectRowLabel(row.original)}
          checked={selection.selectedIds.includes(getRowId(row.original))}
          onChange={() => selection.onToggle(getRowId(row.original))}
        />
      ),
    };

    return [selectColumn, ...columns];
  }, [columns, selection, data.length, getRowId]);

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId: (row) => getRowId(row),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(paging.mode === "pages"
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
    state: {
      sorting: sorting ?? [],
      globalFilter: search?.value ?? "",
      columnVisibility: toVisibilityState(hidden),
      ...(paging.mode === "pages"
        ? {
            pagination: {
              pageIndex: paging.pageIndex,
              pageSize: paging.pageSize,
            },
          }
        : {}),
    },
    onSortingChange: (updater) => {
      if (!onSortingChange) return;
      onSortingChange(
        typeof updater === "function" ? updater(sorting ?? []) : updater,
      );
    },
    onGlobalFilterChange: (updater) => {
      if (!search) return;
      const next =
        typeof updater === "function" ? updater(search.value) : updater;
      search.onChange(String(next ?? ""));
    },
    onColumnVisibilityChange: (updater) => {
      const current = toVisibilityState(hidden);
      const next = typeof updater === "function" ? updater(current) : updater;
      setHidden(toHiddenList(next));
    },
    onPaginationChange: (updater) => {
      if (paging.mode !== "pages") return;
      const current = {
        pageIndex: paging.pageIndex,
        pageSize: paging.pageSize,
      };
      paging.onPaginationChange(
        typeof updater === "function" ? updater(current) : updater,
      );
    },
  });

  const rows = table.getRowModel().rows;

  // Roving tabindex: one row is tabbable at a time and the arrows move between
  // them, so reaching row 40 does not mean forty presses of Tab.
  const [focused, setFocused] = useState(0);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * Only the rows on screen are in the DOM (PRD 4.5, "virtualized table").
   *
   * The row height is declared by the caller rather than measured from the
   * rendered rows. TanStack can measure, but its dynamic-size path expects
   * absolutely positioned items, and a <tr> cannot be positioned -- the layout
   * below stands rows off with spacer rows instead, which is the arrangement
   * the account submissions table has always used.
   *
   * A constant is honest here because rows within one table are uniform: every
   * cell is nowrap and truncating, so the only thing that varies is how many
   * lines a caller's cells draw, which the caller knows. It has to be right,
   * though -- it is what the scrollbar is sized from.
   */
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length
    ? totalSize - virtualRows[virtualRows.length - 1].end
    : 0;

  // Load more when the tail comes into view.
  const onEndReached =
    paging.mode === "infinite" ? paging.onEndReached : undefined;
  const lastVirtualIndex = virtualRows[virtualRows.length - 1]?.index ?? -1;
  useEffect(() => {
    if (!onEndReached) return;
    if (rows.length === 0) return;
    if (lastVirtualIndex >= rows.length - 1) onEndReached();
  }, [lastVirtualIndex, rows.length, onEndReached]);

  /*
   * Moving focus is two steps, because the target row may not exist yet.
   *
   * scrollToIndex asks the virtualizer to render it; the row appears on the
   * commit that follows, and only then can it take focus. The obvious way to
   * wait is requestAnimationFrame -- which is wrong: a background tab or a
   * throttled device does not run frames, and the focus is simply dropped.
   * Keyboard navigation is the one thing that must not depend on animation
   * being scheduled.
   *
   * So the intent is recorded in state and an effect claims it after the
   * render. Effects run on commit, whether or not a frame ever does.
   */
  const [pendingFocus, setPendingFocus] = useState<number | null>(null);

  const focusRow = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, rows.length - 1));
      setFocused(clamped);
      rowVirtualizer.scrollToIndex(clamped, { align: "auto" });
      setPendingFocus(clamped);
    },
    [rows.length, rowVirtualizer],
  );

  useEffect(() => {
    if (pendingFocus === null) return;
    const row = bodyRef.current?.querySelector(
      `tr[data-index="${pendingFocus}"]`,
    );
    if (!row) return; // Not rendered yet; the next commit will carry it.
    (row as HTMLElement).focus();
    setPendingFocus(null);
  });

  if (isLoading) return <LoadingSkeleton className={className} />;

  const visibleColumns = table.getVisibleLeafColumns();
  const totalWidth = table.getTotalSize();
  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div
      className={`animate-enter-late overflow-hidden rounded-panel border border-ink-200 bg-white ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
        {search ? (
          // Sized to its content rather than stretched across the panel. A
          // search box does not become more useful at 700px, and a full-width
          // one reads as the primary thing on a screen whose primary thing is
          // the table.
          <input
            type="search"
            placeholder={search.placeholder}
            aria-label={search.label}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="w-full min-w-0 rounded-xl border border-ink-200 px-3 py-1.5 text-sm text-ink-950 transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none sm:w-64"
          />
        ) : (
          <div className="text-xs text-ink-500">{summary}</div>
        )}
        <div className="flex items-center gap-2">
          {toolbar?.({ hidden, setHidden })}
          <ColumnsMenu
            table={table}
            heading={columnsHeading}
            monospace={columnsMonospace}
          />
          {paging.mode === "pages" && (
            <Select
              label="Rows per page"
              value={paging.pageSize}
              options={(paging.pageSizeOptions ?? [10, 25, 50, 100]).map(
                (n) => ({ value: n, label: `${n} per page` }),
              )}
              onChange={(nextSize) =>
                paging.onPaginationChange({ pageIndex: 0, pageSize: nextSize })
              }
              className="w-auto shrink-0"
            />
          )}
        </div>
      </div>

      {/*
        Grows with the rows, then scrolls. The virtualizer measures this
        element, so the scroll container and the ceiling have to be one box.

        The ceiling is the viewport minus the chrome around it -- the page
        heading, this toolbar and the footer -- rather than a fixed rem value.
        A fixed one is wrong at both ends: 38rem wasted half a tall screen and
        still could not show 25 rows, while on a short screen it pushed the
        pagination controls off the bottom. The floor keeps it usable when the
        viewport is very short.
      */}
      <div
        ref={scrollRef}
        className="max-h-[max(20rem,calc(100vh-22rem))] overflow-auto"
      >
        {/*
          table-layout: fixed is required, not cosmetic. With auto layout a
          table sizes its columns from the rows it can see -- and with
          virtualization that is twenty of them, so the widths would shift
          every time you scrolled a new batch into view. Widths are declared
          once in the colgroup, from each column's own size, and stay put.
        */}
        <table
          className="border-collapse"
          style={{ tableLayout: "fixed", width: totalWidth, minWidth: "100%" }}
        >
          <colgroup>
            {visibleColumns.map((column) => (
              <col key={column.id} style={{ width: column.getSize() }} />
            ))}
          </colgroup>

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
                      className={`px-4 py-3 text-left text-xs font-medium whitespace-nowrap text-ink-500 ${
                        (
                          header.column.columnDef.meta as
                            | DataTableColumnMeta
                            | undefined
                        )?.identifierHeader
                          ? "font-mono"
                          : "tracking-wide uppercase"
                      }`}
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
                          {/* An icon rather than a bare arrow character --
                              that rendered at whatever the system font felt
                              like and sat off the baseline. */}
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

          <tbody ref={bodyRef} className="divide-y divide-ink-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-12">
                  <p className="text-center text-sm text-ink-500">
                    {emptyMessage?.(search?.value ?? "") ?? "Nothing to show."}
                  </p>
                </td>
              </tr>
            ) : (
              <>
                {/*
                  Spacers stand in for the rows above and below the window, so
                  the scrollbar reflects the whole list rather than the dozen
                  rows actually rendered. A tr with no cells collapses, hence
                  the spanning td.
                */}
                {paddingTop > 0 && (
                  <tr aria-hidden>
                    <td
                      colSpan={visibleColumns.length}
                      style={{ height: paddingTop, padding: 0, border: 0 }}
                    />
                  </tr>
                )}

                {virtualRows.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  const index = virtualRow.index;
                  const selected = selection
                    ? selection.selectedIds.includes(row.id)
                    : false;
                  const activatable = Boolean(onRowActivate);
                  return (
                    /*
                     * The whole row opens its record, so every cell is live,
                     * not just a small control at the end of it.
                     *
                     * A tr cannot be wrapped in a link, and a stretched
                     * overlay inside a table cell does not position reliably,
                     * so this is a click handler with a keyboard equivalent.
                     * Action cells stop propagation, or a delete would also
                     * navigate.
                     */
                    <tr
                      key={row.id}
                      data-index={index}
                      tabIndex={index === focused ? 0 : -1}
                      role={activatable ? rowRole : undefined}
                      aria-label={
                        activatable ? rowLabel?.(row.original) : undefined
                      }
                      aria-selected={selection ? selected : undefined}
                      onFocus={() => setFocused(index)}
                      onClick={
                        activatable
                          ? () => onRowActivate?.(row.original)
                          : undefined
                      }
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          focusRow(index + 1);
                        } else if (event.key === "ArrowUp") {
                          event.preventDefault();
                          focusRow(index - 1);
                        } else if (event.key === "Home") {
                          event.preventDefault();
                          focusRow(0);
                        } else if (event.key === "End") {
                          event.preventDefault();
                          focusRow(rows.length - 1);
                        } else if (event.key === "Enter") {
                          event.preventDefault();
                          onRowActivate?.(row.original);
                        } else if (event.key === " ") {
                          // Space selects rather than scrolls where there is a
                          // selection to make, which is what it does in every
                          // other table with checkboxes in it. Where there is
                          // not, it activates like Enter.
                          event.preventDefault();
                          if (selection) selection.onToggle(row.id);
                          else onRowActivate?.(row.original);
                        }
                      }}
                      className={`transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset ${
                        activatable ? "cursor-pointer" : ""
                      } ${
                        selected ? "bg-accent-500/8" : "hover:bg-accent-500/4"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          onClick={
                            cell.column.id === SELECT_COLUMN_ID
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                          className="truncate px-4 py-3 text-sm whitespace-nowrap"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {paddingBottom > 0 && (
                  <tr aria-hidden>
                    <td
                      colSpan={visibleColumns.length}
                      style={{ height: paddingBottom, padding: 0, border: 0 }}
                    />
                  </tr>
                )}

                {paging.mode === "infinite" && paging.isFetchingNextPage && (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="border-0 p-0"
                    >
                      <div className="flex justify-center py-4">
                        <Icon
                          icon={Loading03Icon}
                          className="animate-spin text-ink-400"
                          size={22}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {paging.mode === "pages" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-4 py-3">
          <p className="text-xs text-ink-500 tabular-nums">
            {filteredCount === 0
              ? "No results"
              : `${paging.pageIndex * paging.pageSize + 1}-${Math.min(
                  (paging.pageIndex + 1) * paging.pageSize,
                  filteredCount,
                )} of ${filteredCount.toLocaleString()}`}
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
              Page {paging.pageIndex + 1} of {Math.max(1, table.getPageCount())}
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
      )}

      {footNote?.({ hidden })}
    </div>
  );
}
