import { customType } from "drizzle-orm/pg-core";
import { decryptSecret, encryptSecret } from "./encryption.ts";

/**
 * A text column encrypted on the way to Postgres and decrypted on the way back.
 *
 * At the column rather than at each call site on purpose: the tokens are read
 * in six places across two applications, and a scheme depending on all of them
 * remembering a helper leaks the first time somebody adds a seventh.
 *
 * `dataType` stays "text", so this changes no SQL and needs no migration.
 * Drizzle calls neither hook for null, so an unconnected integration stays
 * null rather than becoming the ciphertext of an empty string.
 */
export const encryptedText = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return "text";
  },
  toDriver(value: string): string {
    return encryptSecret(value);
  },
  fromDriver(value: string): string {
    return decryptSecret(value);
  },
});
