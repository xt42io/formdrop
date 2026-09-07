import { Client } from "pg";
import { E2E_DATABASE_URL } from "./env";

/**
 * Reads the email-verification OTP straight out of the database.
 *
 * Signup is gated on `requireEmailVerification`, and the code arrives by
 * email. Rather than standing up a mail catcher, the suite reads what
 * better-auth wrote -- which is safe to rely on because the app leaves
 * emailOTP's `storeOTP` at its default of "plain":
 *
 *   identifier  email-verification-otp-<email>
 *   value       <otp>:<attempt count>
 *
 * If a future change sets storeOTP to "hashed" or "encrypted", this helper
 * stops working and the assertion below is what will say so, rather than a
 * confusing timeout on the verify page.
 */
export async function readVerificationOtp(email: string): Promise<string> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();

  try {
    const { rows } = await client.query<{ value: string }>(
      `select value
         from verification
        where identifier = $1
        order by created_at desc
        limit 1`,
      [`email-verification-otp-${email}`],
    );

    if (rows.length === 0) {
      throw new Error(
        `No verification row for ${email}. Signup did not reach the ` +
          "send-OTP step -- check the server log for a signup error.",
      );
    }

    const otp = rows[0].value.split(":")[0];
    if (!/^\d{6}$/.test(otp)) {
      throw new Error(
        `Stored OTP for ${email} is not six digits (${JSON.stringify(otp)}). ` +
          "emailOTP's storeOTP option is probably no longer 'plain'.",
      );
    }

    return otp;
  } finally {
    await client.end();
  }
}
