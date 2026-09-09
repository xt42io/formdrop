/**
 * The palette, as values.
 *
 * tokens.css is the source of truth and a CSS class is always the right way to
 * apply a colour. This exists for the places where a class cannot reach:
 *
 * - **Recharts** takes colours as prop strings, not classes.
 * - **Email templates** render in mail clients, where custom properties are
 *   unsupported and a literal hex is the only thing that works.
 * - **SVG `fill`** on a third-party logo, where the colour is the brand's, not
 *   ours.
 * - **Canvas and confetti**, which paint outside the DOM entirely.
 *
 * Every one of those was a hand-typed hex somewhere in apps/web -- 68 of them
 * -- which W4's acceptance forbids outright. Importing from here is not a
 * loophole in that rule: it is what "outside packages/ui tokens" means.
 *
 * GENERATED FROM tokens.css. palette.test.ts parses that file and fails if the
 * two ever disagree, so this cannot quietly drift from the CSS.
 */
export const palette = {
  "accent": "#6f63e4",
  "accent-50": "#f3f2fd",
  "accent-100": "#e9e6fb",
  "accent-200": "#d5cff8",
  "accent-300": "#b8aef2",
  "accent-400": "#9587ea",
  "accent-500": "#6f63e4",
  "accent-600": "#5b4ed6",
  "accent-700": "#4a3eb6",
  "accent-800": "#3d3494",
  "accent-900": "#342d76",
  "accent-950": "#201b4c",
  "ink-50": "#f8f8f8",
  "ink-100": "#efeef1",
  "ink-200": "#dedde1",
  "ink-300": "#c0bec6",
  "ink-400": "#9592a0",
  "ink-500": "#726f7e",
  "ink-600": "#595763",
  "ink-700": "#46444d",
  "ink-800": "#2d2c32",
  "ink-900": "#1e1d21",
  "ink-950": "#151518",
  "canvas": "#f8f7fc",
  "tint-green": "#cdf0dd",
  "tint-green-ink": "#1f6b45",
  "tint-mint": "#e2f4ea",
  "tint-violet": "#e5d9ff",
  "tint-violet-ink": "#5b3ba8",
  "tint-lavender": "#f3ebff",
  "tint-lilac": "#d8d0fb",
  "tint-blue": "#cfe2ff",
  "tint-blue-ink": "#2b4c9b",
  "tint-amber": "#ffeac0",
  "tint-amber-ink": "#8a5a00",
  "tint-rose": "#fde3dd",
  "tint-rose-ink": "#b4341f",
  "tint-pink": "#ffd6e3",
  "code-string": "#ffa08c",
} as const;

export type ColorToken = keyof typeof palette;

/**
 * Colours that belong to somebody else.
 *
 * These are deliberately not in tokens.css and never will be: they are not
 * ours to re-tune, and a palette change must not touch them. A Google "G" in
 * our violet is not a Google "G" -- it is a trademark rendered wrong.
 *
 * They live here so that "no raw hex in apps/web" stays literally true, and so
 * that anyone grepping for a brand colour finds one place holding it.
 */
export const brand = {
  google: {
    blue: "#4285F4",
    green: "#34A853",
    yellow: "#FBBC05",
    red: "#EA4335",
  },
} as const;
