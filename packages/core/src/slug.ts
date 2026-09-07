/**
 * Form slug generation, previously written inline in the create-form handler.
 *
 * The random source is injectable so the generator can be tested
 * deterministically — the alphabet and length are the parts worth pinning,
 * since the slug becomes part of a public URL that must never change shape.
 */
const SLUG_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const SLUG_LENGTH = 8;

export function generateFormSlug(random: () => number = Math.random): string {
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += SLUG_ALPHABET.charAt(Math.floor(random() * SLUG_ALPHABET.length));
  }
  return slug;
}
