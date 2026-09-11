import {
  EmailSendError,
  type EmailProvider,
  type SendEmailInput,
  type SendEmailResult,
} from "../provider.ts";

/**
 * SendByte -- the destination of W7, and the one file in this package that
 * D3 actually blocks.
 *
 * The PRD lists what is missing: base URL, auth scheme, send payload shape,
 * template support, delivery webhooks, sandbox/test mode and rate limits.
 * Guessing at those would produce an adapter that looks finished, passes a
 * test written against the same guess, and fails on the real API.
 *
 * So it throws rather than falling back to another provider, which is how a
 * cutover comes to look like it worked. When the docs arrive the work is the
 * body of `send` and nothing else.
 */
export function sendByteProvider(): EmailProvider {
  return {
    name: "sendbyte",

    async send(_input: SendEmailInput): Promise<SendEmailResult> {
      throw new EmailSendError(
        "sendbyte",
        "The SendByte adapter is not implemented: its API contract (D3) has " +
          "not been provided. Set EMAIL_PROVIDER to 'resend' or 'zeptomail' " +
          "until it has.",
      );
    },
  };
}
