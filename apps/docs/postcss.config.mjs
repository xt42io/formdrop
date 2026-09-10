/**
 * Tailwind v4 runs as a PostCSS plugin here.
 *
 * apps/web uses @tailwindcss/vite, which does the same job inside Vite. Next
 * has no Vite, so the docs go through PostCSS instead -- same Tailwind, same
 * tokens, different bundler. Without this the @import "tailwindcss" in
 * global.css is passed through untouched and the site renders unstyled.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
