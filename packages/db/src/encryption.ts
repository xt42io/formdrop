import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Envelope encryption for the OAuth tokens on `forms` (PRD appendix 5).
 *
 * A refresh token is a standing grant on somebody's Drive, so in plaintext a
 * database read hands over the accounts as well as the rows.
 *
 * AES-256-GCM, random IV per value. GCM rather than CBC because the tag makes
 * tampering a decrypt failure instead of a plausible-looking wrong answer.
 *
 * The ciphertext is not bound to its row, so someone who can already write to
 * the database could move one form's token onto another -- a larger compromise
 * than this defends against, and a Drizzle custom type has no row id to bind.
 */

/** Marks a value as ours, and leaves room to change scheme later. */
const PREFIX = "fd.v1.";

const IV_BYTES = 12;
const KEY_BYTES = 32;

let cached: Buffer | null = null;

/**
 * Read on first use, not at import: otherwise every consumer of @formdrop/db
 * would need the key set, including ones that never touch a token.
 */
function key(): Buffer {
  if (cached) return cached;

  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set, so OAuth tokens cannot be read or " +
        "written. Generate one with: openssl rand -base64 32",
    );
  }

  // Either encoding, so whatever a platform's generator produces just works.
  const decoded = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");

  if (decoded.length !== KEY_BYTES) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY decodes to ${decoded.length} bytes, not ${KEY_BYTES}. ` +
        "Generate one with: openssl rand -base64 32",
    );
  }

  cached = decoded;
  return cached;
}

/** Forgets the cached key. For tests that change the environment. */
export function resetEncryptionKey() {
  cached = null;
}

/**
 * Whether a stored value is one of ours. No token this holds can collide with
 * the prefix: Google's begin `ya29.` and `1//`, Airtable's `pat` and `oaa`.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return [
    PREFIX + iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    body.toString("base64url"),
  ].join(".");
}

/**
 * Decrypts a stored value, passing legacy plaintext through unchanged.
 *
 * That passthrough is the dual-read window: it is what lets the backfill run
 * after a deploy rather than having to finish before the first request.
 */
export function decryptSecret(value: string): string {
  if (!isEncrypted(value)) return value;

  // Counted rather than tested for truthiness: an empty string seals to an
  // empty body, which is a legitimate value.
  const parts = value.split(".");
  if (parts.length !== 5) {
    throw new Error("Encrypted value is malformed: expected iv, tag and body");
  }
  const [, , iv, tag, body] = parts;

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  // final() throws when the tag does not match -- a wrong key or an edited
  // row, either of which would otherwise be sent to Google as a token.
  return Buffer.concat([
    decipher.update(Buffer.from(body, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
