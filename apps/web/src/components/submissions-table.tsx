import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@formdrop/ui";
import {
  Cancel01Icon,
  Loading03Icon,
  Tick02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import moment from "moment";
import type { Submission } from "@/lib/app-client";

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

  return { hidden, toggle };
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
  lastRowRef: (node: HTMLTableRowElement | null) => void;
  isFetchingNextPage: boolean;
}

export function SubmissionsTable({
  formId,
  submissions,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  lastRowRef,
  isFetchingNextPage,
}: SubmissionsTableProps) {
  const allColumns = useMemo(
    () =>
      Array.from(new Set(submissions.flatMap((s) => Object.keys(s.payload)))),
    [submissions],
  );

  const { hidden, toggle } = useHiddenColumns(formId);
  const columns = allColumns.filter((c) => !hidden.includes(c));

  // Roving tabindex: one row is tabbable at a time and the arrows move between
  // them, so reaching row 40 does not mean forty presses of Tab.
  const [focused, setFocused] = useState(0);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const focusRow = (index: number) => {
    const clamped = Math.max(0, Math.min(index, submissions.length - 1));
    setFocused(clamped);
    const row = bodyRef.current?.querySelectorAll("tr[data-row]")[clamped];
    (row as HTMLElement | undefined)?.focus();
  };

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

  return (
    <div className="animate-enter-late mt-3 overflow-hidden rounded-panel border border-ink-200 bg-white">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
        <p className="text-xs text-ink-500">
          {selectedIds.length > 0
            ? `${selectedIds.length} selected`
            : `${submissions.length.toLocaleString()} loaded`}
        </p>
        {allColumns.length > 0 && (
          <ColumnsMenu columns={allColumns} hidden={hidden} onToggle={toggle} />
        )}
      </div>

      <div className="max-h-[32rem] overflow-auto">
        <table className="w-full border-collapse">
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
            {submissions.map((submission, index) => {
              const selected = selectedIds.includes(submission.id);
              return (
                <tr
                  key={submission.id}
                  data-row
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
                      className="max-w-xs truncate px-4 py-3 text-xs whitespace-nowrap text-ink-700"
                    >
                      {truncate(cellText(submission.payload[column]))}
                    </td>
                  ))}
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-ink-400">
                    {submission.ip || "-"}
                  </td>
                </tr>
              );
            })}

            <tr ref={lastRowRef}>
              <td colSpan={columns.length + 3} className="border-0 p-0">
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Icon
                      icon={Loading03Icon}
                      className="animate-spin text-ink-400"
                      size={22}
                    />
                  </div>
                )}
              </td>
            </tr>
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
