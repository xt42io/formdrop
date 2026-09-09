import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Icon } from "@formdrop/ui";
import {
  Cancel01Icon,
  Loading03Icon,
  Tick02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import moment from "moment";
import type { Submission } from "@/lib/app-client";
import { useSavedViews } from "./submissions/saved-views";
import { ViewsMenu } from "./submissions/views-menu";

/**
 * The submissions table (W4 section 4.5, "the workhorse view").
 *
 * A real <table>, unlike the forms list: the columns here are derived from the
 * payload and vary per form, so a fixed grid template cannot describe them.
 * The header is a sticky <thead> inside the scroll container rather than a
 * separate element above it -- the same structural point as the forms list,
 * where a header outside the scroller kept the full width while the rows lost
 * the scrollbar's gutter, and every value ended up a scrollbar-width off.
 *
 * Rows open a drawer rather than navigating, so they are not links; they are
 * keyboard-reachable through a roving tabindex instead.
 */
const HIDDEN_COLUMNS_KEY = "formdrop:submissions-hidden-columns";

/*
 * Column widths, in pixels, because table-layout: fixed needs them declared
 * rather than inferred. The table is allowed to be wider than its container --
 * the payload columns keep a readable width and the container scrolls -- which
 * is why this is a width and a minWidth rather than w-full.
 */
const SELECT_W = 44;
const RECEIVED_W = 148;
const PAYLOAD_W = 180;
const IP_W = 132;

function truncate(value: string, max = 60) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function cellText(value: unknown): string {
  if (value === undefined || value === null) return "-";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/** Which payload columns are hidden, remembered per form. */
function useHiddenColumns(formId: string) {
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        `${HIDDEN_COLUMNS_KEY}:${formId}`,
      );
      setHidden(stored ? (JSON.parse(stored) as string[]) : []);
    } catch {
      setHidden([]);
    }
  }, [formId]);

  const toggle = (column: string) => {
    setHidden((current) => {
      const next = current.includes(column)
        ? current.filter((c) => c !== column)
        : [...current, column];
      try {
        window.localStorage.setItem(
          `${HIDDEN_COLUMNS_KEY}:${formId}`,
          JSON.stringify(next),
        );
      } catch {
        // Preference simply will not persist.
      }
      return next;
    });
  };

  /** Applying a saved view replaces the whole set rather than toggling. */
  const replace = (next: string[]) => {
    setHidden(next);
    try {
      window.localStorage.setItem(
        `${HIDDEN_COLUMNS_KEY}:${formId}`,
        JSON.stringify(next),
      );
    } catch {
      // Preference simply will not persist.
    }
  };

  return { hidden, toggle, replace };
}

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

function ColumnsMenu({
  columns,
  hidden,
  onToggle,
}: {
  columns: string[];
  hidden: string[];
  onToggle: (column: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <Icon icon={ViewIcon} size={14} />
        Columns
        {hidden.length > 0 && (
          <span className="rounded-full bg-accent-500/12 px-1.5 text-[11px] font-semibold text-accent-600 tabular-nums">
            {columns.length - hidden.length}/{columns.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 max-h-72 w-56 overflow-y-auto rounded-card border border-ink-200 bg-white p-1.5">
          <p className="px-2.5 py-1.5 text-[11px] font-medium tracking-wide text-ink-400 uppercase">
            Payload fields
          </p>
          {columns.map((column) => {
            const visible = !hidden.includes(column);
            return (
              <button
                key={column}
                type="button"
                onClick={() => onToggle(column)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    visible
                      ? "border-accent-500 bg-accent-500 text-white"
                      : "border-ink-300"
                  }`}
                >
                  {visible && <Icon icon={Tick02Icon} size={11} />}
                </span>
                <span className="truncate font-mono text-xs">{column}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface SubmissionsTableProps {
  formId: string;
  submissions: Submission[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpen: (submission: Submission) => void;
  /**
   * Called when the reader reaches the end of what is loaded.
   *
   * A sentinel row watched by an IntersectionObserver cannot work here: with
   * virtualization the last row is not in the DOM until you scroll to it, so
   * the observer would have nothing to see. The virtualizer already knows
   * which rows it is rendering, so the last index is the signal.
   */
  onEndReached: () => void;
  isFetchingNextPage: boolean;
}

export function SubmissionsTable({
  formId,
  submissions,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onEndReached,
  isFetchingNextPage,
}: SubmissionsTableProps) {
  const allColumns = useMemo(
    () =>
      Array.from(new Set(submissions.flatMap((s) => Object.keys(s.payload)))),
    [submissions],
  );

  const { hidden, toggle, replace } = useHiddenColumns(formId);
  const { views, save, remove } = useSavedViews(formId);
  const columns = allColumns.filter((c) => !hidden.includes(c));

  // Roving tabindex: one row is tabbable at a time and the arrows move between
  // them, so reaching row 40 does not mean forty presses of Tab.
  const [focused, setFocused] = useState(0);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * Only the rows on screen are in the DOM (PRD W4 4.5, "virtualized table").
   *
   * 41px is a measured row: py-3 top and bottom against a text-xs line box,
   * plus the divider. Rows are uniform because every cell is nowrap and
   * truncating, so a fixed estimate is honest here rather than a guess the
   * virtualizer has to keep correcting.
   */
  const rowVirtualizer = useVirtualizer({
    count: submissions.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 41,
    overscan: 12,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length
    ? totalSize - virtualRows[virtualRows.length - 1].end
    : 0;

  // Load more when the tail comes into view. This replaces a sentinel row and
  // an IntersectionObserver, which cannot work once the last row only exists
  // in the DOM after you have already scrolled to it.
  const lastVirtualIndex = virtualRows[virtualRows.length - 1]?.index ?? -1;
  useEffect(() => {
    if (submissions.length === 0) return;
    if (lastVirtualIndex >= submissions.length - 1) onEndReached();
  }, [lastVirtualIndex, submissions.length, onEndReached]);

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
      const clamped = Math.max(0, Math.min(index, submissions.length - 1));
      setFocused(clamped);
      rowVirtualizer.scrollToIndex(clamped, { align: "auto" });
      setPendingFocus(clamped);
    },
    [submissions.length, rowVirtualizer],
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

  const onRowKeyDown = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    submission: Submission,
    index: number,
  ) => {
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
      focusRow(submissions.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onOpen(submission);
    } else if (event.key === " ") {
      // Space selects rather than scrolls, which is what it does in every
      // other table with checkboxes in it.
      event.preventDefault();
      onToggleSelect(submission.id);
    }
  };

  const allSelected =
    submissions.length > 0 && selectedIds.length === submissions.length;

  const tableWidth = SELECT_W + RECEIVED_W + columns.length * PAYLOAD_W + IP_W;

  return (
    <div className="animate-enter-late mt-3 overflow-hidden rounded-panel border border-ink-200 bg-white">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
        <p className="text-xs text-ink-500">
          {selectedIds.length > 0
            ? `${selectedIds.length} selected`
            : `${submissions.length.toLocaleString()} loaded`}
        </p>
        {allColumns.length > 0 && (
          <div className="flex items-center gap-2">
            <ViewsMenu
              views={views}
              hidden={hidden}
              onApply={(view) => replace(view.hidden)}
              onSave={(name) => save(name, hidden)}
              onDelete={remove}
            />
            <ColumnsMenu
              columns={allColumns}
              hidden={hidden}
              onToggle={toggle}
            />
          </div>
        )}
      </div>

      {/*
        The virtualizer measures this element, so the scroll container and the
        max height have to be the same box.
      */}
      <div ref={scrollRef} className="max-h-[32rem] overflow-auto">
        {/*
          table-layout: fixed is required, not cosmetic. With auto layout a
          table sizes its columns from the rows it can see -- and with
          virtualization that is twenty of them, so the widths would shift
          every time you scrolled a new batch into view. Fixed widths are
          declared once in the colgroup and stay put.
        */}
        <table
          className="border-collapse"
          style={{ tableLayout: "fixed", width: tableWidth, minWidth: "100%" }}
        >
          <colgroup>
            <col style={{ width: SELECT_W }} />
            <col style={{ width: RECEIVED_W }} />
            {columns.map((column) => (
              <col key={column} style={{ width: PAYLOAD_W }} />
            ))}
            <col style={{ width: IP_W }} />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-ink-50">
            <tr className="border-b border-ink-200">
              <th scope="col" className="w-10 px-4 py-3">
                <RoundCheckbox
                  label="Select all loaded submissions"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-ink-500 uppercase"
              >
                Received
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-4 py-3 text-left font-mono text-xs font-medium whitespace-nowrap text-ink-500"
                >
                  {column}
                </th>
              ))}
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-ink-500 uppercase"
              >
                IP
              </th>
            </tr>
          </thead>

          <tbody ref={bodyRef} className="divide-y divide-ink-100">
            {/*
              Spacers stand in for the rows above and below the window, so the
              scrollbar reflects the whole list rather than the dozen rows
              actually rendered. A <tr> with no cells collapses, hence the
              colSpan'd td.
            */}
            {paddingTop > 0 && (
              <tr aria-hidden>
                <td
                  colSpan={columns.length + 3}
                  style={{ height: paddingTop, padding: 0, border: 0 }}
                />
              </tr>
            )}

            {virtualRows.map((virtualRow) => {
              const submission = submissions[virtualRow.index];
              const index = virtualRow.index;
              const selected = selectedIds.includes(submission.id);
              return (
                <tr
                  key={submission.id}
                  data-row
                  data-index={index}
                  tabIndex={index === focused ? 0 : -1}
                  onKeyDown={(e) => onRowKeyDown(e, submission, index)}
                  onFocus={() => setFocused(index)}
                  onClick={() => onOpen(submission)}
                  aria-selected={selected}
                  className={`group cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset ${
                    selected ? "bg-accent-500/8" : "hover:bg-accent-500/4"
                  }`}
                >
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RoundCheckbox
                      label={`Select submission from ${moment(submission.createdAt).format("MMM D, h:mm A")}`}
                      checked={selected}
                      onChange={() => onToggleSelect(submission.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-ink-700 tabular-nums">
                    {moment(submission.createdAt).format("MMM D, h:mm A")}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="truncate px-4 py-3 text-xs whitespace-nowrap text-ink-700"
                    >
                      {truncate(cellText(submission.payload[column]))}
                    </td>
                  ))}
                  <td className="truncate px-4 py-3 font-mono text-xs whitespace-nowrap text-ink-400">
                    {submission.ip || "-"}
                  </td>
                </tr>
              );
            })}

            {paddingBottom > 0 && (
              <tr aria-hidden>
                <td
                  colSpan={columns.length + 3}
                  style={{ height: paddingBottom, padding: 0, border: 0 }}
                />
              </tr>
            )}

            {isFetchingNextPage && (
              <tr>
                <td colSpan={columns.length + 3} className="border-0 p-0">
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
          </tbody>
        </table>
      </div>

      {hidden.length > 0 && (
        <div className="flex items-center gap-2 border-t border-ink-100 bg-ink-50/60 px-4 py-2 text-xs text-ink-500">
          <Icon icon={Cancel01Icon} size={12} />
          {hidden.length} column{hidden.length === 1 ? "" : "s"} hidden
        </div>
      )}
    </div>
  );
}
