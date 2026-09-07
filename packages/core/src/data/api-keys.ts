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
