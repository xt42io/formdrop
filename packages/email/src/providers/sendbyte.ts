import {
  EmailSendError,
  type EmailAddress,
  type EmailProvider,
  type SendEmailInput,
  type SendEmailResult,
} from "../provider.ts";

const DEFAULT_BASE_URL = "https://api.sendbyte.africa/v1";

/** The error envelope every SendByte failure shares, whatever the status. */
interface SendByteError {
  error?: { code?: string; message?: string; docs_url?: string };
}

/** 201 on a new send, 200 on an idempotent replay. Same body either way. */
interface SendByteAccepted {
  id?: string;
  status?: string;
  sandbox?: boolean;
}

function addressLine(address: EmailAddress): string {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

/**
 * SendByte -- the destination of W7.
 *
 * Two things about this API shape the adapter. It is **asynchronous**: a 201
 * means the message was accepted into a queue, not that anyone received it, so
 * the id returned here is a handle for tracking rather than proof of delivery.
 * And it is **idempotent on request**: re-sending with the same
 * idempotency_key returns the original email instead of creating a second one.
 *
 * That second property matters to us specifically. The outbox worker retries a
 * delivery that failed, and a send which actually succeeded but timed out on
 * the way back is indistinguishable from one that never happened. Passing a
 * key derived from the logical send is what stops a retry putting a second
 * copy of the same notification in somebody's inbox.
 *
 * Sandbox keys (sk_test_) simulate the whole pipeline without delivering or
 * requiring a verified domain, which is what makes this safe to exercise
 * before the domain is set up.
 */
export function sendByteProvider(
  apiKey: string,
  from: EmailAddress,
  options: { baseUrl?: string; fetch?: typeof globalThis.fetch } = {},
): EmailProvider {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const doFetch = options.fetch ?? globalThis.fetch;

  return {
    name: "sendbyte",

    async send(input: SendEmailInput): Promise<SendEmailResult> {
      let response: Response;

      try {
        response = await doFetch(`${baseUrl}/emails`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: addressLine(from),
            to: addressLine(input.to),
            subject: input.subject,
            html: input.html,
            text: input.text,
            ...(input.replyTo ? { reply_to: input.replyTo.email } : {}),
            ...(input.idempotencyKey
              ? { idempotency_key: input.idempotencyKey }
              : {}),
          }),
        });
      } catch (cause) {
        // A refused connection or a DNS failure never reaches the block below,
        // and an unwrapped TypeError from fetch would reach the delivery log
        // as "fetch failed" with no provider attached to it.
        throw new EmailSendError(
          "sendbyte",
          `Request to SendByte failed: ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
        );
      }

      if (!response.ok) {
        throw new EmailSendError(
          "sendbyte",
          await failureMessage(response),
          response.status,
        );
      }

      const body = (await response
        .json()
        .catch(() => ({}))) as SendByteAccepted;

      // `status` is "queued" here, not "delivered". The id is what makes the
      // difference answerable later.
      return { messageId: body.id ?? null };
    },
  };
}

/**
 * Turns a failed response into one readable line.
 *
 * The code is what goes first, because it is the stable half -- SendByte's own
 * guidance is to branch on `error.code` rather than on the message, and it is
 * the code a reader of the delivery log will search for.
 */
async function failureMessage(response: Response): Promise<string> {
  let parsed: SendByteError = {};

  try {
    parsed = (await response.json()) as SendByteError;
  } catch {
    // An error page from a proxy rather than from SendByte. The status is
    // still worth reporting, so this is not a failure in itself.
  }

  const code = parsed.error?.code;
  const message = parsed.error?.message;

  const detail = [code, message].filter(Boolean).join(": ");
  const base = detail || `HTTP ${response.status}`;

  // 429 carries the wait in a header rather than the body. Losing it would
  // leave the worker's backoff guessing at a number the server already stated.
  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) return `${base} (retry after ${retryAfter}s)`;
  }

  return base;
}
