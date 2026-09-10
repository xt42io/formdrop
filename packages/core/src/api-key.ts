import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * API key generation and hashing (PRD W2).
 *
 * "Keys are stored in plaintext today, so a database read is a full
 * credential leak. Store SHA-256, show the plaintext once at creation, keep a
 * display prefix (`fd_live_…`)."
 *
 * SHA-256 rather than bcrypt or argon2, deliberately. Those exist to make
 * guessing a *human-chosen* password expensive, and their cost is paid on
 * every authenticated request. A key here is 48 hex characters from a CSPRNG,
 * so there is nothing to guess -- brute force is not the threat, a database
 * read is, and a fast hash defeats that just as completely without putting
 * 100ms on the critical path of every API call.
 *
 * This module uses node:crypto but no database, network or environment, which
 * is what the pure entry point means: it can be unit tested without a
 * connection string.
 */

/** What every key starts with, so one is recognisable on sight. */
export const API_KEY_PREFIX = "fd_live_";

/** Characters of a key kept for display, including the prefix. */
const DISPLAY_LENGTH = API_KEY_PREFIX.length + 8;

/**
 * A new key.
 *
 * 24 random bytes, which is 192 bits -- far past anything worth attacking,
 * and the same width the keys generated before hashing used.
 */
export function generateApiKey(): string {
  return `${API_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
}

/**
 * The stored form of a key.
 *
 * Unsalted, and that is on purpose rather than an oversight: a salt would
 * make the hash unfindable by lookup, and authentication here is "find the
 * row for this key" rather than "check this key against a row we already
 * located by username". With 192 bits of entropy there is no rainbow table to
 * defend against.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * The part of a key safe to show in a list, e.g. `fd_live_9f2a7c41`.
 *
 * Once the plaintext is gone this is the only human-readable handle a key
 * has, so it has to be enough to tell two of them apart while being far too
 * short to be useful to anyone who reads it.
 */
export function apiKeyPrefix(key: string): string {
  return key.slice(0, DISPLAY_LENGTH);
}

/**
 * Compares two hashes without leaking where they diverge.
 *
 * The lookup is by hash so this is not on the authentication path today, but
 * any comparison of a credential-derived value should be constant time -- the
 * variable-time version is the kind of thing that gets copied to somewhere it
 * does matter.
 */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  // timingSafeEqual throws on a length mismatch, which would itself be a
  // signal; different lengths are simply not equal.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
