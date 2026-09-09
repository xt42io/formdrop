import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

/**
 * A select, built rather than borrowed.
 *
 * A native `<select>` cannot be styled past its border: the option list is
 * drawn by the operating system, so it arrives in the OS font at the OS size
 * with the OS highlight colour, and the tokens stop at the edge of the
 * trigger. On a screen where every other control is ours it reads as a piece
 * of somebody else's product.
 *
 * This is the same panel the columns and views menus use -- same trigger
 * shape, same outside-click and Escape dismissal -- so the dashboard has one
 * idea of what an opened menu looks like rather than three.
 *
 * The trade is real and worth naming: a native select gets mobile's wheel
 * picker, type-ahead and full keyboard semantics for free, and this does not.
 * It is a listbox with arrow-key support and nothing more, which is the right
 * amount for a short, fixed set of options and would not be for a long one.
 */
export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string | number> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Names the control for assistive tech. */
  label: string;
  className?: string;
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  label,
  className = "",
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    // Open on the current choice, so the arrows move from where you are
    // rather than from the top of the list.
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));

    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, options, value]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open && (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(options[active].value);
      setOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-ink-200 px-3 py-1.5 text-sm whitespace-nowrap text-ink-700 transition-colors hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        {selected?.label ?? ""}
        <Icon
          icon={ArrowDown01Icon}
          size={14}
          className={`shrink-0 text-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-30 mt-2 min-w-full rounded-card border border-ink-200 bg-white p-1.5"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(index)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm whitespace-nowrap transition-colors ${
                  index === active ? "bg-ink-50" : ""
                } ${isSelected ? "text-accent-700" : "text-ink-700"}`}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center">
                  {isSelected && <Icon icon={Tick02Icon} size={12} />}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
