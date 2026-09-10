import { db } from "@formdrop/db";
import { apiKeys } from "@formdrop/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { apiKeyPrefix, generateApiKey, hashApiKey } from "../api-key.ts";

/**
 * API key rows, stored as SHA-256 (PRD W2).
 *
 * A database read used to be a full credential leak: every key sat in the
 * table in plaintext, and the dashboard's list endpoint returned all of them.
 * Now a key exists in readable form exactly once -- in the response to the
 * request that created it.
 */

/**
 * The list behind the dashboard.
 *
 * The projection is the point. `select()` returned every column, which
 * included the plaintext key, so the list endpoint handed back a working
 * credential for every key the account owned on every page load. Callers get
 * the prefix and nothing else.
 */
export function listApiKeysForUser(userId: string) {
  return db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

/**
 * Creates a key and returns the plaintext once.
 *
 * Generated here rather than by the caller so there is one definition of what
 * a key looks like and no route can invent a different one. The plaintext is
 * returned but never stored -- `key` stays null, and this is the only moment
 * it can be shown.
 */
export async function createApiKey(input: { userId: string; name: string }) {
  const plaintext = generateApiKey();

  const [row] = await db
    .insert(apiKeys)
    .values({
      userId: input.userId,
      name: input.name,
      keyHash: hashApiKey(plaintext),
      keyPrefix: apiKeyPrefix(plaintext),
    })
    .returning({
      id: apiKeys.id,
      userId: apiKeys.userId,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    });

  // Separated from the row on purpose: everything in `apiKey` is safe to
  // store, log or return again, and `plaintext` is not.
  return { apiKey: row, plaintext };
}

/** Scoped by owner as well as id, so one user cannot delete another's key. */
export async function deleteApiKey(userId: string, keyId: string) {
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
}

const AUTHENTICATED_COLUMNS = {
  id: apiKeys.id,
  userId: apiKeys.userId,
  name: apiKeys.name,
  lastUsedAt: apiKeys.lastUsedAt,
  createdAt: apiKeys.createdAt,
};

/**
 * Authenticates a key presented on a request.
 *
 * Two lookups, which is the risk register's mitigation rather than
 * indecision: "hash-on-next-use dual-read window, then forced rotation".
 * Keys issued before hashing exist only as plaintext, and refusing them the
 * moment this deploys would break every existing integration without notice.
 *
 * So: look up by hash first, which is every new key and every old key that
 * has been seen since. Fall back to the plaintext column, and when that hits,
 * upgrade the row in place -- write the hash and prefix, clear the plaintext.
 * A key is therefore migrated the first time it is used, and the fallback
 * stops matching anything once the last active key has been through it.
 *
 * The projection never includes the key or its hash, so an authenticated
 * request cannot echo the credential it arrived with into a response or a log
 * line.
 */
export async function findApiKeyByValue(presented: string) {
  const hash = hashApiKey(presented);

  const [hashed] = await db
    .select(AUTHENTICATED_COLUMNS)
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);

  if (hashed) return hashed;

  const [legacy] = await db
    .select(AUTHENTICATED_COLUMNS)
    .from(apiKeys)
    .where(eq(apiKeys.key, presented))
    .limit(1);

  if (!legacy) return null;

  /*
   * Upgrade on use.
   *
   * Guarded on the plaintext still matching so two concurrent requests with
   * the same old key cannot both write -- the second finds nothing to update,
   * which is the correct outcome rather than an error. Awaited, because the
   * row must not be left half-migrated if the process stops here, and it
   * happens at most once per key in the table's lifetime.
   */
  await db
    .update(apiKeys)
    .set({
      keyHash: hash,
      keyPrefix: apiKeyPrefix(presented),
      key: null,
    })
    .where(and(eq(apiKeys.id, legacy.id), eq(apiKeys.key, presented)));

  return legacy;
}

/**
 * Records that a key was used.
 *
 * Separate from the lookup so a caller can decide whether to await it. The
 * Express middleware awaited this before running the handler, which put a
 * write on the critical path of every authenticated request.
 */
export async function touchApiKeyLastUsed(keyId: string) {
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}
