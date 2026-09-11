/**
 * The seam W7 is built on.
 *
 * Three providers sit behind it -- Resend, ZeptoMail and SendByte -- and the
 * product calls none of them directly. Switching is a configuration change
 * plus one adapter, rather than an edit to every call site in two
 * applications.
 *
 * Nothing in these shapes assumes a provider SDK, which is what lets that
 * hold.
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface SendEmailInput {
  to: EmailAddress;
  subject: string;
  html: string;
  /**
   * Plain-text alternative, always sent.
   *
   * Not optional by accident: a message with no text part scores worse with
   * spam filters, and some clients show it in the preview line. React Email
   * can produce it from the same component, so there is no reason to skip it.
   */
  text: string;
  replyTo?: EmailAddress;
  /**
   * Stable identifier for the logical send, when the caller has one.
   *
   * A provider that supports it returns the original message instead of
   * creating a second one, which is what stops the outbox worker's retry
   * putting a duplicate in somebody's inbox after a send that succeeded but
   * timed out on the way back. Providers without the concept ignore it.
   */
  idempotencyKey?: string;
}

export interface SendEmailResult {
  /**
   * The provider's own id, when it gives one. Stored on the delivery row so a
   * question about one specific email can be looked up with the provider
   * rather than guessed at from timestamps.
   */
  messageId: string | null;
}

export interface EmailProvider {
  /** Shown in logs and on the delivery row, so failures name a provider. */
  readonly name: string;

  /**
   * Sends one message.
   *
   * Throws on failure rather than returning an error, so a caller that
   * forgets to check cannot silently believe a message went out. Recording
   * the failure is `sendEmail`'s job, not the adapter's -- an adapter that
   * also wrote to the database would have to be stubbed to test either one.
   */
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

/** Raised by an adapter when the provider rejects or the request fails. */
export class EmailSendError extends Error {
  readonly provider: string;
  readonly status?: number;

  constructor(provider: string, message: string, status?: number) {
    super(message);
    this.name = "EmailSendError";
    this.provider = provider;
    this.status = status;
  }
}
