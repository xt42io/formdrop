import { db } from "@formdrop/db";
import { apiKeys } from "@formdrop/db/schema";
import { and, desc, eq } from "drizzle-orm";

/**
 * API key rows.
 *
 * Key generation and hashing deliberately stay out of here: the PRD schedules
 * moving from plaintext keys to stored SHA-256 with a show-once flow as part
 * of the Elysia port, and doing half of it now would leave two spellings of
 * what a key is.
 */
export function listApiKeysForUser(userId: string) {
  return db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(input: {
  userId: string;
  key: string;
  name: string;
}) {
  const [apiKey] = await db.insert(apiKeys).values(input).returning();

  return apiKey;
}

/** Scoped by owner as well as id, so one user cannot delete another's key. */
export async function deleteApiKey(userId: string, keyId: string) {
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
}

/**
 * Authenticates a key presented on a request.
 *
 * Plaintext comparison, matching what the Express middleware does today --
 * W2's "parity first" applies here, and the move to stored SHA-256 with a
 * show-once flow is a correction that needs a migration, not something to
 * half-land during the port.
 *
 * The projection is deliberate: `key` itself is never returned, so an
 * authenticated request cannot accidentally echo the credential it arrived
 * with into a response or a log line.
 */
export async function findApiKeyByValue(key: string) {
  const [row] = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      name: apiKeys.name,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);

  return row ?? null;
}

/**
 * Records that a key was used.
 *
 * Separate from the lookup so a caller can decide whether to await it. The
 * Express middleware awaits this before running the handler, which puts a
 * write on the critical path of every authenticated request.
 */
export async function touchApiKeyLastUsed(keyId: string) {
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId));
}
