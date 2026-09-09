import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { Icon, Modal } from "@formdrop/ui";
import {
  AddToListIcon,
  AnalyticsUpIcon,
  Key01Icon,
  Search01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@formdrop/ui";
import { useForms } from "@/hooks/use-forms";

/**
 * The command palette (PRD 4.5).
 *
 * 4.5 asks the shell for "a command palette for form switching". Forms are
 * therefore the substance of it: every form the account owns is reachable by
 * name, which is the thing that does not scale in a sidebar once somebody has
 * thirty of them. The four fixed destinations are here too, because a palette
 * that answers for forms but not for Settings sends you back to the sidebar
 * half the time and stops being worth reaching for.
 *
 * It is a dialog rather than a dropdown so it can be opened from anywhere with
 * one shortcut and does not have to be anchored to a control that might be
 * scrolled off, collapsed to an icon, or behind the mobile drawer.
 */
interface Command {
  id: string;
  label: string;
  /** Second line, e.g. the form's slug. */
  detail?: string;
  icon: IconSvgElement;
  group: string;
  run: () => void;
}

const PaletteContext = createContext<{ open: () => void } | null>(null);

/**
 * Opens the palette from anywhere inside the dashboard.
 *
 * A context rather than lifted state because the two things that open it -- a
 * header button and a global key handler -- are at different depths, and
 * threading a setter down to the header would put dialog state in the layout
 * for no other reason.
 */
export function useCommandPalette() {
  const context = useContext(PaletteContext);
  if (!context) {
    throw new Error("useCommandPalette must be used inside CommandPalette");
  }
  return context;
}

/** Substring, case-insensitive, over the label and the detail line. */
function matches(command: Command, query: string) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return (
    command.label.toLowerCase().includes(needle) ||
    (command.detail?.toLowerCase().includes(needle) ?? false)
  );
}

export function CommandPalette({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Only fetched once the palette has been opened. The forms list is not
  // needed to render the dashboard, and paying for it on every page load to
  // populate a dialog most visits never open is the wrong trade.
  const { data: forms = [] } = useForms({ enabled: isOpen });

  const commands = useMemo<Command[]>(() => {
    const destinations: Command[] = [
      {
        id: "nav:forms",
        label: "Forms",
        icon: AddToListIcon,
        group: "Go to",
        run: () => navigate({ to: "/app/forms" }),
      },
      {
        id: "nav:analytics",
        label: "Analytics",
        icon: AnalyticsUpIcon,
        group: "Go to",
        run: () => navigate({ to: "/app/analytics" }),
      },
      {
        id: "nav:api-keys",
        label: "API Keys",
        icon: Key01Icon,
        group: "Go to",
        run: () => navigate({ to: "/app/api-keys" }),
      },
      {
        id: "nav:settings",
        label: "Settings",
        icon: Settings02Icon,
        group: "Go to",
        // Settings requires its tab in the search params, so the palette has
        // to name one rather than land on a route with no valid state.
        run: () =>
          navigate({ to: "/app/settings", search: { tab: "profile" } }),
      },
    ];

    const formCommands: Command[] = forms.map((form) => ({
      id: `form:${form.id}`,
      label: form.name,
      detail: form.slug,
      icon: AddToListIcon,
      group: "Forms",
      // Lands on the submissions tab rather than the form's overview: the
      // reason to jump to a form is almost always to look at what came in.
      run: () =>
        navigate({
          to: "/app/forms/$id/submissions",
          params: { id: form.id },
        }),
    }));

    return [...formCommands, ...destinations];
  }, [forms, navigate]);

  const results = useMemo(
    () => commands.filter((command) => matches(command, query)),
    [commands, query],
  );

  // A filtered list is a different list, so a selection index carried over
  // from the last keystroke points at something the reader never chose.
  useEffect(() => setActive(0), [query]);

  // Cmd+K on mac, Ctrl+K elsewhere. Bound to the window so it works from any
  // screen in the dashboard without every screen knowing about it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = () => {
    setIsOpen(false);
    // Cleared on close rather than on open, so the dialog never appears for a
    // frame still showing the last search.
    setQuery("");
  };

  const choose = (command: Command | undefined) => {
    if (!command) return;
    command.run();
    close();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[active]);
    }
  };

  // Keeps the highlighted row in view when the arrows walk past the fold.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let lastGroup = "";

  return (
    <PaletteContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}

      <Modal
        isOpen={isOpen}
        onClose={close}
        align="top"
        size="lg"
        radius="rounded-2xl"
        label="Search forms and pages"
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4">
          <Icon
            icon={Search01Icon}
            size={17}
            className="shrink-0 text-ink-400"
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search forms and pages"
            aria-label="Search forms and pages"
            // The listbox is described to assistive tech through the rows
            // below; this input owns the keyboard for it.
            role="combobox"
            aria-expanded
            aria-controls="command-palette-results"
            aria-activedescendant={
              results[active] ? `command-${results[active].id}` : undefined
            }
            className="w-full bg-transparent py-4 text-[15px] text-ink-950 placeholder:text-ink-500 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-ink-200 px-1.5 py-0.5 font-sans text-[11px] text-ink-500 sm:block">
            Esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="command-palette-results"
          role="listbox"
          aria-label="Results"
          className="max-h-[min(24rem,50vh)] overflow-y-auto p-1.5"
        >
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-ink-500">
              Nothing matches “{query}”.
            </p>
          ) : (
            results.map((command, index) => {
              const heading =
                command.group !== lastGroup ? command.group : null;
              lastGroup = command.group;
              const selected = index === active;
              return (
                <div key={command.id}>
                  {heading && (
                    <p className="px-2.5 pt-2 pb-1.5 text-[11px] font-medium tracking-wide text-ink-500 uppercase">
                      {heading}
                    </p>
                  )}
                  <button
                    type="button"
                    id={`command-${command.id}`}
                    role="option"
                    aria-selected={selected}
                    data-index={index}
                    // Pointer moves select rather than a hover style alone, so
                    // the mouse and the arrows cannot disagree about which row
                    // Enter would take.
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(command)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                      selected ? "bg-accent-500/8" : ""
                    }`}
                  >
                    <Icon
                      icon={command.icon}
                      size={16}
                      className={selected ? "text-accent-600" : "text-ink-400"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink-950">
                        {command.label}
                      </span>
                      {command.detail && (
                        <span className="block truncate font-mono text-xs text-ink-500">
                          {command.detail}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </PaletteContext.Provider>
  );
}
