import { sql } from "drizzle-orm";
import { db } from "../src/index.ts";
import { encryptSecret, isEncrypted } from "../src/encryption.ts";

/**
 * Seals the OAuth tokens written before encryption landed.
 *
 * Legacy rows already read fine, so nothing is broken until this runs -- what
 * is not true until it runs is that a database read no longer hands over the
 * accounts.
 *
 * Safe to repeat, and safe against a database serving traffic: sealed rows are
 * filtered out in SQL, and each write is conditional on the column still
 * holding what was read, so a token refreshed mid-run is not reverted.
 *
 *   TOKEN_ENCRYPTION_KEY=... npx tsx scripts/encrypt-oauth-tokens.ts [--dry-run]
 */

const COLUMNS = [
  "google_sheets_access_token",
  "google_sheets_refresh_token",
  "airtable_access_token",
  "airtable_refresh_token",
] as const;

const dryRun = process.argv.includes("--dry-run");

async function main() {
  // Raw SQL for the read: going through the schema would decrypt on the way
  // out and hide which rows still need doing.
  const stillPlain = COLUMNS.map(
    (column) => `(${column} IS NOT NULL AND ${column} NOT LIKE 'fd.v1.%')`,
  ).join(" OR ");

  const found = await db.execute(
    sql.raw(
      `SELECT id, ${COLUMNS.join(", ")} FROM forms WHERE ${stillPlain} ORDER BY id`,
    ),
  );
  const rows = found.rows as Array<Record<string, string | null>>;

  if (rows.length === 0) {
    console.log("Nothing to do: every stored OAuth token is already sealed.");
    return;
  }

  console.log(`${rows.length} form(s) hold at least one plaintext token.`);
  if (dryRun) {
    console.log("--dry-run, so nothing was written.");
    return;
  }

  let sealed = 0;
  let raced = 0;

  for (const row of rows) {
    const pending = COLUMNS.flatMap((column) => {
      const current = row[column];
      if (current === null || isEncrypted(current)) return [];
      return [{ column, current, next: encryptSecret(current) }];
    });

    if (pending.length === 0) continue;

    // Identifiers through sql.raw, values through the template so they are
    // bound rather than interpolated.
    const assignments = sql.join(
      pending.map((p) => sql`${sql.raw(p.column)} = ${p.next}`),
      sql`, `,
    );
    const unchanged = sql.join(
      pending.map((p) => sql`${sql.raw(p.column)} = ${p.current}`),
      sql` AND `,
    );

    const result = await db.execute(
      sql`UPDATE forms SET ${assignments} WHERE id = ${row.id} AND ${unchanged}`,
    );

    if (result.rowCount === 0) raced += 1;
    else sealed += 1;
  }

  console.log(`Sealed ${sealed} form(s).`);
  if (raced > 0) {
    console.log(
      `${raced} changed while this ran and were left alone. Run it again.`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  });
