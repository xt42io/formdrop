import { Link } from "@tanstack/react-router";
import moment from "moment";
import type { Form } from "@/lib/app-client";

/**
 * The forms list: table layout, whole-row links.
 *
 * Built from a grid rather than a <table> so each row can be a real anchor.
 * A <tr> cannot be wrapped in a link, and positioning a stretched overlay
 * inside one is unreliable -- so the columns are a shared grid template that
 * the header and every row use, which looks identical and lets the row be
 * exactly what it behaves like: one link to one form.
 *
 * The sparkline and the delivery pills are gone. Both were comparisons between
 * forms, and comparisons live on the analytics page; here the useful content
 * is the same four things the cards showed -- name, id, count, created.
 */
/**
 * Shared by the header and every row.
 *
 * The submissions column is a fixed width rather than `auto` on purpose. Each
 * row is its own grid container, so an `auto` track sizes to that row's own
 * content -- the header resolved it to 87px for the word "SUBMISSIONS" while a
 * row resolved it to 46px for "1,284", and the two columns stopped being the
 * same box. A fixed track makes every grid resolve identically.
 *
 * Both that column and Created are flush left, heading and value alike. Right
 * -aligned numerals are the usual convention, but here the heading is a long
 * word and the values are one to five characters, so flush right left them
 * hanging far from the label they belong to -- and inconsistent with the
 * Created column sitting next to them.
 */
/*
 * Created drops below sm. Three tracks needed 272px of fixed width plus gaps
 * inside a 327px content box, which left the form name -- the thing you are
 * actually scanning for -- a couple of characters wide, since minmax(0,1fr)
 * will happily shrink to nothing. A date is the least useful of the three on a
 * phone, so it is the one that goes.
 */
const COLUMNS =
  "grid-cols-[minmax(0,1fr)_4.5rem] sm:grid-cols-[minmax(0,1fr)_7rem_10rem] items-center gap-3 sm:gap-4";

export function FormsTable({ forms }: { forms: Form[] }) {
  return (
    <div className="animate-enter-late mt-3 overflow-hidden rounded-panel border border-ink-200 bg-white">
      {/* Grows with the rows up to a ceiling, then scrolls. The header lives
          INSIDE this box, stuck to the top, rather than above it -- outside,
          it kept the full width while the rows lost the scrollbar's gutter,
          so every value sat a scrollbar-width left of its own column heading
          the moment there were enough forms to scroll. */}
      <div className="max-h-[26rem] overflow-y-auto">
        <div
          className={`${COLUMNS} sticky top-0 z-10 hidden border-b border-ink-200 bg-ink-50 px-4 py-3 sm:grid sm:px-6`}
        >
          <span className="text-xs font-medium tracking-wide text-ink-500 uppercase">
            Form
          </span>
          <span className="text-xs font-medium tracking-wide text-ink-500 uppercase">
            Submissions
          </span>
          <span className="hidden text-xs font-medium tracking-wide text-ink-500 uppercase sm:inline">
            Created
          </span>
        </div>

        <div className="divide-y divide-ink-100">
          {forms.map((form) => (
            <Link
              key={form.id}
              to="/app/forms/$id/submissions"
              params={{ id: form.id }}
              className={`${COLUMNS} group relative grid px-4 py-4 transition-colors sm:px-6 sm:py-5 hover:bg-accent-500/4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset`}
            >
              {/* An accent rail on the row under the cursor, so the eye has an
                edge to track along. Scaled rather than faded. */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-0.5 scale-y-0 bg-accent-500 transition-transform duration-200 group-hover:scale-y-100"
              />

              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink-950 transition-colors group-hover:text-accent-600">
                  {form.name}
                </div>
                <div className="mt-1 truncate font-mono text-xs text-ink-400">
                  {form.id}
                </div>
              </div>

              <div className="text-base font-semibold text-ink-950 tabular-nums">
                {(form.submissionCount ?? 0).toLocaleString()}
              </div>

              <div className="hidden text-sm whitespace-nowrap text-ink-500 sm:block">
                {moment(form.createdAt).format("MMM D, YYYY")}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
