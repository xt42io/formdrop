import { useEffect, useRef, useState } from "react";
import { Icon } from "@formdrop/ui";
import { Tick02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import type { Table } from "@tanstack/react-table";

/**
 * Column visibility for the admin tables (PRD 4.6).
 *
 * 4.6 asks these to carry "the same column controls as the user-facing
 * versions". The account submissions table has had one since W4; this is the
 * cross-tenant equivalent, deliberately built to the same trigger and panel so
 * the two read as the same control rather than two takes on one.
 *
 * It differs in what it drives. The account table's columns come from the
 * payload and vary per form, so it tracks a list of hidden keys itself. These
 * tables have fixed columns, so this drives TanStack's own visibility state
 * and the column definitions stay the source of truth.
 */
const KEY = "formdrop:admin-columns";

export function ColumnsMenu<T>({ table }: { table: Table<T> }) {
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

  // Only columns with a real header can be listed -- the actions column has
  // none, and "hide the unlabelled one" is not an offer worth making.
  const hideable = table
    .getAllLeafColumns()
    .filter(
      (column) => column.getCanHide() && Boolean(column.columnDef.header),
    );

  if (hideable.length === 0) return null;

  const hiddenCount = hideable.filter((c) => !c.getIsVisible()).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <Icon icon={ViewIcon} size={14} />
        Columns
        {hiddenCount > 0 && (
          <span className="rounded-full bg-accent-500/12 px-1.5 text-[11px] font-semibold text-accent-600 tabular-nums">
            {hideable.length - hiddenCount}/{hideable.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 max-h-72 w-56 overflow-y-auto rounded-card border border-ink-200 bg-white p-1.5">
          {hideable.map((column) => {
            const visible = column.getIsVisible();
            const isLastVisible =
              visible && hiddenCount === hideable.length - 1;
            return (
              <button
                key={column.id}
                type="button"
                // Refusing to hide the last one, rather than letting the table
                // become a stack of empty rows with no way back except the
                // menu you just emptied.
                disabled={isLastVisible}
                onClick={() => column.toggleVisibility(!visible)}
                title={
                  isLastVisible ? "At least one column has to stay" : undefined
                }
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
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
                <span className="truncate">
                  {String(column.columnDef.header)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Reads the stored visibility for a table, if there is one. */
export function readColumnVisibility(tableId: string): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(`${KEY}:${tableId}`);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function writeColumnVisibility(
  tableId: string,
  visibility: Record<string, boolean>,
) {
  try {
    window.localStorage.setItem(
      `${KEY}:${tableId}`,
      JSON.stringify(visibility),
    );
  } catch {
    // Private mode, or storage disabled. The choice lives for this session.
  }
}
