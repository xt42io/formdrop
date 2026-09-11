/**
 * The e2e suite's environment, and the guard that keeps it away from real data.
 *
 * The smoke path writes: signing up inserts a user, creating a form inserts a
 * row, submitting inserts a submission. Pointed at a developer's own database
 * it would leave a junk account and a junk form behind on every run.
 *
 * So E2E_DATABASE_URL must be set explicitly and there is deliberately no
 * fallback to DATABASE_URL -- a default that happens to point at real data is
 * the exact failure this exists to prevent.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set.\n\n` +
        "The e2e suite needs a throwaway Postgres it is allowed to write to,\n" +
        "with the migrations in packages/db/drizzle applied. It will not fall\n" +
        "back to DATABASE_URL.",
    );
  }
  return value;
}

export const E2E_DATABASE_URL = required("E2E_DATABASE_URL");

// An exact string match is the signal that matters: pointing both at the same
// server but different databases is fine, pointing them at the same database
// means the suite is about to write where the running app reads.
if (process.env.DATABASE_URL?.trim() === E2E_DATABASE_URL.trim()) {
  throw new Error(
    "E2E_DATABASE_URL is the same as DATABASE_URL.\n\n" +
      "The suite would sign up users and create forms in the database the app " +
      "itself is using. Point it at a separate, disposable database.",
  );
}

export const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 4321);
export const API_PORT = Number(process.env.E2E_API_PORT ?? 4322);
export const WEB_URL = `http://localhost:${WEB_PORT}`;
export const API_URL = `http://localhost:${API_PORT}`;

/**
 * Handed to both servers.
 *
 * The auth secret is fixed rather than generated so a session cookie survives
 * a server restart mid-run.
 *
 * The billing and email keys are passed through from the environment rather
 * than stubbed, and an empty string is a supported value for both: the Polar
 * plugin is only registered when a token exists, and a failed OTP send is
 * swallowed, so signup completes either way and writes the code this suite
 * reads out of the database.
 */
export const serverEnv: Record<string, string> = {
  DATABASE_URL: E2E_DATABASE_URL,
  BETTER_AUTH_SECRET: "e2e-secret-not-used-anywhere-real",
  BETTER_AUTH_URL: WEB_URL,
  POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN ?? "",
  POLAR_PRODUCT_ID: process.env.POLAR_PRODUCT_ID ?? "e2e-product",
  POLAR_PRODUCT_ID_YEARLY: process.env.POLAR_PRODUCT_ID_YEARLY ?? "e2e-product",
  POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET ?? "e2e-webhook",
  // Absent on purpose. @formdrop/email throws on a missing key, and
  // sendVerificationOTP swallows that, so the OTP is still written to the
  // database where the suite reads it -- no mail server in the loop.
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
};
