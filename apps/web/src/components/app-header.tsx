import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { Icon } from "@formdrop/ui";
import {
  ArrowDown01Icon,
  Menu01Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { useForms } from "@/hooks/use-forms";
import { useCommandPalette } from "./command-palette";

/**
 * The dashboard header (PRD 4.5).
 *
 * 4.5 asks the shell for "a persistent form switcher in the header". There was
 * no header on desktop at all -- only a mobile bar carrying the drawer button
 * -- so this is that bar grown into the real thing, rather than a second
 * element above it.
 *
 * Persistent means it is here on every dashboard screen, not only the ones
 * scoped to a form. On the others it offers the list; on a form it names the
 * one you are in, which is also the thing the old shell could not tell you
 * without reading the URL.
 */

/**
 * The tab within a form, so switching forms keeps you on the same one.
 *
 * Checked against the real tabs rather than returned as read. The segment
 * comes out of the URL, and interpolating an unrecognised one into a route
 * would build a path that does not exist -- a crafted or stale link would turn
 * a form switch into a navigation error.
 */
const FORM_TABS = [
  "submissions",
  "analytics",
  "notifications",
  "integrations",
  "settings",
] as const;

type FormTab = (typeof FORM_TABS)[number];

function currentFormTab(pathname: string): FormTab | null {
  const segment = pathname.match(/^\/app\/forms\/[^/]+\/([^/]+)/)?.[1];
  return FORM_TABS.includes(segment as FormTab) ? (segment as FormTab) : null;
}

export function AppHeader({ onOpenNav }: { onOpenNav: () => void }) {
  const palette = useCommandPalette();
  const navigate = useNavigate();
  const location = useLocation();

  // strict: false because this header renders on every dashboard screen, and
  // most of them have no :id to read.
  const params = useParams({ strict: false }) as { id?: string };
  const formId = params.id;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: forms = [] } = useForms();
  const current = forms.find((form) => form.id === formId);

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

  // Closing on navigation, so choosing a form does not leave the menu open
  // over the page it just took you to.
  useEffect(() => setOpen(false), [location.pathname]);

  const tab = currentFormTab(location.pathname);

  const switchTo = (id: string) => {
    // Staying on the same tab is the point of switching from here: comparing
    // two forms' submissions means two clicks, not two clicks and a re-tab.
    navigate({
      to: `/app/forms/$id/${tab ?? "submissions"}`,
      params: { id },
    });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-ink-100 bg-white/90 px-4 py-2.5 backdrop-blur-sm">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open menu"
        className="shrink-0 cursor-pointer rounded-lg p-1.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 md:hidden"
      >
        <Icon icon={Menu01Icon} size={20} />
      </button>

      <div className="relative min-w-0" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex max-w-[14rem] cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-medium text-ink-950 transition-colors hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 sm:max-w-xs"
        >
          <span className="truncate">
            {current ? current.name : "All forms"}
          </span>
          <Icon
            icon={ArrowDown01Icon}
            size={15}
            className="shrink-0 text-ink-400"
          />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Switch form"
            className="absolute left-0 z-40 mt-1.5 max-h-80 w-64 overflow-y-auto rounded-card border border-ink-200 bg-white p-1.5 shadow-lg"
          >
            <Link
              to="/app/forms"
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-ink-700 transition-colors hover:bg-ink-50"
            >
              <span className="flex size-4 shrink-0 items-center justify-center text-accent-600">
                {!current && <Icon icon={Tick02Icon} size={12} />}
              </span>
              All forms
            </Link>

            {forms.length > 0 && (
              <div className="my-1.5 border-t border-ink-100" />
            )}

            {forms.map((form) => {
              const selected = form.id === formId;
              return (
                <button
                  key={form.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => switchTo(form.id)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center text-accent-600">
                    {selected && <Icon icon={Tick02Icon} size={12} />}
                  </span>
                  <span className="truncate">{form.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={palette.open}
        // Names the shortcut rather than relying on people guessing it. The
        // key cap is decorative, so it is hidden from the accessible name.
        aria-label="Search forms and pages"
        aria-keyshortcuts="Meta+K Control+K"
        className="ml-auto flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-2.5 py-1.5 text-sm text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <Icon icon={Search01Icon} size={15} />
        <span className="hidden sm:inline">Search</span>
        <kbd
          aria-hidden
          className="hidden rounded border border-ink-200 px-1.5 py-0.5 font-sans text-[11px] text-ink-500 sm:block"
        >
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
