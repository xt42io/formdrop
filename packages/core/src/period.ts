/**
 * The bucket key usage rows are counted into.
 *
 * The collect endpoint computes this as a UTC calendar day
 * (`new Date().toISOString().slice(0, 10)`), and that is what production data
 * is keyed on, so it is what this returns.
 *
 * Worth knowing: `apps/web/scripts/seed.ts` builds the same key with
 * `moment(...).format("YYYY-MM-DD")`, which is *local* time. For anyone west of
 * UTC those two disagree for part of every day, so seeded rows can land in a
 * different bucket than a real submission made at the same moment. Left as-is
 * rather than changed underneath existing data; the seed script should adopt
 * this function.
 */
export function usagePeriod(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}
