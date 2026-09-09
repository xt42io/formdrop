/**
 * Which columns a reader has hidden, remembered across visits.
 *
 * Stored as the hidden list rather than TanStack's VisibilityState, which is
 * the inverse: a map of every column to a boolean. The list is the smaller
 * shape and, more usefully, it is the shape a saved view already stores -- so
 * applying a view is an assignment rather than a translation, and the two
 * cannot disagree about what "hidden" means.
 *
 * Columns absent from the list are visible, including ones that did not exist
 * when the preference was written. That is the right default for the
 * submissions table, whose columns come from the payload and appear as forms
 * gain fields.
 */
export function readHidden(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // An older build of the admin tables wrote a VisibilityState here. It
    // parses, so it has to be rejected on shape rather than on failure.
    return Array.isArray(parsed)
      ? parsed.filter((c): c is string => typeof c === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeHidden(key: string, hidden: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(hidden));
  } catch {
    // Private mode, or storage disabled. The choice lives for this session.
  }
}

/** The hidden list as TanStack states it: every hidden column mapped to false. */
export function toVisibilityState(hidden: string[]): Record<string, boolean> {
  return Object.fromEntries(hidden.map((column) => [column, false]));
}

/** The inverse, for handing a TanStack change back to storage or a view. */
export function toHiddenList(visibility: Record<string, boolean>): string[] {
  return Object.entries(visibility)
    .filter(([, visible]) => !visible)
    .map(([column]) => column);
}
