import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { forms } from "./schema.ts";
import { isEncrypted, resetEncryptionKey } from "./encryption.ts";

/**
 * Asserted against the real `forms` columns, not the custom type in isolation.
 *
 * The risk is not that AES works -- encryption.test.ts covers that -- it is a
 * column going back to plain `text()` in a later edit, which would compile and
 * leave every other test passing.
 */
const KEY = Buffer.alloc(32, 3).toString("base64");

const TOKEN_COLUMNS = [
  "googleSheetsAccessToken",
  "googleSheetsRefreshToken",
  "airtableAccessToken",
  "airtableRefreshToken",
] as const;

beforeEach(() => {
  process.env.TOKEN_ENCRYPTION_KEY = KEY;
  resetEncryptionKey();
});

afterEach(() => {
  delete process.env.TOKEN_ENCRYPTION_KEY;
  resetEncryptionKey();
});

describe("the OAuth token columns", () => {
  it.each(TOKEN_COLUMNS)("seals %s on the way to Postgres", (name) => {
    const column = forms[name];
    const stored = column.mapToDriverValue("1//0gL9-secret-value") as string;

    expect(isEncrypted(stored)).toBe(true);
    expect(stored).not.toContain("secret-value");
    expect(column.mapFromDriverValue(stored)).toBe("1//0gL9-secret-value");
  });

  it.each(TOKEN_COLUMNS)("is still a text column, so %s needs no DDL", (name) => {
    // The whole approach rests on this: a change here means a migration
    // nobody generated.
    expect(forms[name].getSQLType()).toBe("text");
  });

  it("leaves the non-secret integration columns alone", () => {
    // Encrypting these would break the IS NOT NULL checks behind the
    // "connected" pills, and buy nothing.
    const plain = forms.googleSheetsSpreadsheetId.mapToDriverValue("sheet-1");
    expect(plain).toBe("sheet-1");
  });
});
