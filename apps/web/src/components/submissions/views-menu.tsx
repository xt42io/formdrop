import { useEffect, useRef, useState } from "react";
import { Icon } from "@formdrop/ui";
import {
  Bookmark02Icon,
  Delete02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { SavedView } from "./saved-views";

/**
 * Save, apply and delete column layouts (PRD W4 4.5, "saved views").
 *
 * Deliberately the same shape as the Columns menu next to it -- same trigger,
 * same panel, same dismissal -- because they are two halves of one idea and a
 * second interaction pattern for the pair would be one too many.
 */
export function ViewsMenu({
  views,
  hidden,
  onApply,
  onSave,
  onDelete,
}: {
  views: SavedView[];
  /** The layout as it stands, so "Save" captures what is on screen. */
  hidden: string[];
  onApply: (view: SavedView) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
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

  const matching = views.find(
    (v) =>
      v.hidden.length === hidden.length &&
      v.hidden.every((c) => hidden.includes(c)),
  );

  const submit = () => {
    if (!name.trim()) return;
    onSave(name);
    setName("");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <Icon icon={Bookmark02Icon} size={14} />
        {/* Naming the active view is the point of saving one -- otherwise you
            cannot tell from the toolbar which layout you are looking at. */}
        {matching ? matching.name : "Views"}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-card border border-ink-200 bg-white p-1.5">
          {views.length > 0 ? (
            <>
              <p className="px-2.5 py-1.5 text-[11px] font-medium tracking-wide text-ink-400 uppercase">
                Saved views
              </p>
              {views.map((view) => (
                <div
                  key={view.id}
                  className="group flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-ink-50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onApply(view);
                      setOpen(false);
                    }}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center text-accent-600">
                      {matching?.id === view.id && (
                        <Icon icon={Tick02Icon} size={12} />
                      )}
                    </span>
                    <span className="truncate">{view.name}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-ink-400 tabular-nums">
                      {view.hidden.length
                        ? `${view.hidden.length} hidden`
                        : "all"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(view.id)}
                    aria-label={`Delete the ${view.name} view`}
                    className="shrink-0 cursor-pointer rounded p-1 text-ink-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-tint-rose-ink focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    <Icon icon={Delete02Icon} size={13} />
                  </button>
                </div>
              ))}
              <div className="my-1.5 border-t border-ink-100" />
            </>
          ) : (
            <p className="px-2.5 py-2 text-xs leading-relaxed text-ink-500">
              Hide the columns you do not need, then save that layout here to
              come back to it.
            </p>
          )}

          <div className="flex items-center gap-1.5 p-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Name this layout"
              aria-label="Name for the saved view"
              className="min-w-0 flex-1 rounded-lg border border-ink-200 px-2 py-1.5 text-xs text-ink-950 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!name.trim()}
              className="shrink-0 cursor-pointer rounded-lg bg-accent-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
