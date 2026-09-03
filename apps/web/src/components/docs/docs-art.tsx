/**
 * Line-art illustrations for the docs cards, drawn on a graph-paper ground.
 *
 * Stroke-only and sized in one 96x72 space so the whole set reads as a family.
 * They take their colour from the parent, so a card only sets a text colour.
 * Each illustration is used exactly once per page — the panels are large enough
 * that a repeat reads as a mistake.
 */
export function GridPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-accent-200/70 bg-accent-50/40 [background-image:linear-gradient(to_right,rgb(111_99_228/0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgb(111_99_228/0.10)_1px,transparent_1px)] [background-size:18px_18px]"
    >
      {children}
    </div>
  );
}

/**
 * The same graph-paper ground at icon scale, for list rows. Finer pitch so the
 * grid still reads at 44px, and it sets the accent colour the glyph inherits.
 */
export function ArtTile({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent-200/70 bg-accent-50/40 text-accent-600 [background-image:linear-gradient(to_right,rgb(111_99_228/0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgb(111_99_228/0.12)_1px,transparent_1px)] [background-size:9px_9px]"
    >
      {children}
    </div>
  );
}

const SVG = {
  viewBox: "0 0 96 72",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-24 w-auto text-accent-500",
};

/** Getting started: a launch. */
export function RocketArt() {
  return (
    <svg {...SVG}>
      <path d="M48 6c8 9 12 19 12 29 0 6-2 12-5 16H41c-3-4-5-10-5-16 0-10 4-20 12-29z" />
      <circle cx="48" cy="29" r="5" />
      <path d="M36 42l-9 9 10 1" />
      <path d="M60 42l9 9-10 1" />
      <path d="M43 55l5 11 5-11" />
    </svg>
  );
}

/** A form on the page: the thing you point at FormDrop. */
export function FormArt() {
  return (
    <svg {...SVG}>
      <rect x="26" y="6" width="44" height="60" rx="5" />
      <path d="M34 18h16" />
      <rect x="34" y="25" width="28" height="9" rx="2.5" />
      <rect x="34" y="38" width="28" height="9" rx="2.5" />
      <rect x="34" y="51" width="17" height="9" rx="2.5" />
    </svg>
  );
}

/** Braces beside a stack of records, for the API reference. */
export function ApiArt() {
  return (
    <svg {...SVG}>
      <path d="M28 18c-5 0-4 14-8 18 4 4 3 18 8 18" />
      <path d="M46 18c5 0 4 14 8 18-4 4-3 18-8 18" />
      <path d="M62 28l14-6 14 6-14 6z" />
      <path d="M62 38l14-6 14 6-14 6z" />
      <path d="M62 48l14-6 14 6-14 6z" />
    </svg>
  );
}

/** One submission fanning out to its destinations. */
export function IntegrationsArt() {
  return (
    <svg {...SVG}>
      <rect x="38" y="8" width="20" height="14" rx="4" />
      <circle cx="20" cy="58" r="7" />
      <circle cx="48" cy="58" r="7" />
      <circle cx="76" cy="58" r="7" />
      <path d="M48 22v8" />
      <path d="M44 30c-16 2-24 8-24 21" />
      <path d="M52 30c16 2 24 8 24 21" />
      <path d="M48 30v21" />
    </svg>
  );
}

/** An arrival: the notification side of a submission. */
export function NotifyArt() {
  return (
    <svg {...SVG}>
      <rect x="14" y="24" width="42" height="28" rx="4" />
      <path d="M14 29l21 15 21-15" />
      <path d="M74 22a9 9 0 0 1 9 9v9l3 5H62l3-5v-9a9 9 0 0 1 9-9z" />
      <path d="M70 45a4.5 4.5 0 0 0 9 0" />
      <path d="M74 18v4" />
    </svg>
  );
}

/** Zero config: it just goes. */
export function BoltArt() {
  return (
    <svg {...SVG}>
      <path d="M54 6L32 40h14l-4 26 22-34H50z" />
      <path d="M22 20c-3 4-4 9-4 16" />
      <path d="M74 20c3 4 4 9 4 16" />
    </svg>
  );
}

/** Spam protection: what gets stopped at the door. */
export function ShieldArt() {
  return (
    <svg {...SVG}>
      <path d="M48 6l23 9v19c0 15-9 25-23 32-14-7-23-17-23-32V15z" />
      <path d="M38 36l7 8 15-16" />
    </svg>
  );
}

/** Rows arriving in a sheet, over a webhook. */
export function SheetArt() {
  return (
    <svg {...SVG}>
      <rect x="14" y="16" width="38" height="40" rx="4" />
      <path d="M14 27h38" />
      <path d="M27 27v29" />
      <path d="M14 41h38" />
      <path d="M58 36h16" />
      <path d="M70 31l6 5-6 5" />
      <circle cx="84" cy="36" r="6" />
    </svg>
  );
}
