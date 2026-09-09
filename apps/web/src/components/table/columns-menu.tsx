import { useEffect, useRef, useState } from "react";
import { Icon } from "@formdrop/ui";
import { Tick02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import type { Table } from "@tanstack/react-table";

/**
 * Column visibility, for every table (PRD 4.5 and 4.6).
 *
 * There were two of these: one over the submissions table's payload keys and
 * one over the admin tables' TanStack columns. They rendered the same panel
 * from different inputs. Now that both tables are driven by TanStack columns
 * there is one input, so there is one menu.
 *
 * `heading` is the only thing the two callers still differ on: the payload
 * columns want to be named as payload fields, because on that table they are
 * the form's own fields rather than a fixed set someone chose.
 */
export function ColumnsMenu<T>({
  table,
  heading,
  monospace = false,
}: {
  table: Table<T>;
  heading?: string;
  /** Payload keys are identifiers and read better as such. */
  monospace?: boolean;
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

  // Only columns with a real header can be listed -- the selection and action
  // columns have none, and "hide the unlabelled one" is not an offer worth
  // making.
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
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
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
          {heading && (
            <p className="px-2.5 py-1.5 text-[11px] font-medium tracking-wide text-ink-400 uppercase">
              {heading}
            </p>
          )}
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
                <span
                  className={`truncate ${monospace ? "font-mono text-xs" : ""}`}
                >
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
