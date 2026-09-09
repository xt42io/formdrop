import { useCallback, useEffect, useState } from "react";

/**
 * Saved views for the submissions table (PRD W4 4.5).
 *
 * A view is a named column layout, stored per form. That is deliberately all
 * it is today: hidden columns are the only view state this table has, because
 * there is no sorting or filtering to capture yet. `SavedView` is versioned
 * and stores `hidden` as its own field rather than being a bare string[], so
 * a filter or a sort can join it later without invalidating what people have
 * already saved.
 *
 * localStorage, per form, for the same reason the hidden-columns preference
 * already lives there: a column layout is one person's working setup, not
 * account state, and putting it in the database would mean a migration and an
 * endpoint for something nobody else can see.
 *
 * The trade is honest and worth stating: views do not follow you to another
 * browser, and clearing site data loses them.
 */
export interface SavedView {
  /** Bumped if the stored shape ever changes; unknown versions are dropped. */
  version: 1;
  id: string;
  name: string;
  hidden: string[];
}

const VIEWS_KEY = "formdrop:submissions-views";

function storageKey(formId: string) {
  return `${VIEWS_KEY}:${formId}`;
}

function read(formId: string): SavedView[] {
  try {
    const raw = window.localStorage.getItem(storageKey(formId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Anything malformed or from a future version is discarded rather than
    // rendered. A view is a convenience; a crash on load is not a fair price
    // for one bad entry left behind by an older build.
    return parsed.filter(
      (v): v is SavedView =>
        typeof v === "object" &&
        v !== null &&
        (v as SavedView).version === 1 &&
        typeof (v as SavedView).id === "string" &&
        typeof (v as SavedView).name === "string" &&
        Array.isArray((v as SavedView).hidden),
    );
  } catch {
    return [];
  }
}

export function useSavedViews(formId: string) {
  const [views, setViews] = useState<SavedView[]>([]);

  // Read in an effect, not during render: this is localStorage, and the server
  // render has none. Reading it inline would hydrate-mismatch for anyone who
  // has saved a view.
  useEffect(() => {
    setViews(read(formId));
  }, [formId]);

  const persist = useCallback(
    (next: SavedView[]) => {
      setViews(next);
      try {
        window.localStorage.setItem(storageKey(formId), JSON.stringify(next));
      } catch {
        // Private mode, or storage disabled. The view lives for this session.
      }
    },
    [formId],
  );

  const save = useCallback(
    (name: string, hidden: string[]) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const existing = views.find(
        (v) => v.name.toLowerCase() === trimmed.toLowerCase(),
      );

      // Saving over a name you already used updates it rather than leaving two
      // entries that differ only by invisible whitespace.
      const next = existing
        ? views.map((v) => (v.id === existing.id ? { ...v, hidden } : v))
        : [
            ...views,
            {
              version: 1 as const,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              name: trimmed,
              hidden,
            },
          ];

      persist(next);
    },
    [views, persist],
  );

  const remove = useCallback(
    (id: string) => persist(views.filter((v) => v.id !== id)),
    [views, persist],
  );

  return { views, save, remove };
}
