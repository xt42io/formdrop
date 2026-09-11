/**
 * The seam W7 is built on.
 *
 * D3 is still outstanding: SendByte's base URL, auth scheme, payload shape,
 * template support, webhooks, sandbox mode and rate limits are not specified
 * anywhere we have. The PRD's answer is to define our own interface now and
 * put the existing providers behind it, so that when the contract does arrive
 * the SendByte adapter is the only file it touches -- not every call site in
 * two applications.
 *
 * Nothing in these shapes assumes a provider SDK -- the point is that they
 * survive being handed to a different one.
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
