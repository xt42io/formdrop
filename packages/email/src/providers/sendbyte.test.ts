import { describe, expect, it, vi } from "vitest";
import { sendByteProvider } from "./sendbyte.ts";
import { EmailSendError, type SendEmailInput } from "../provider.ts";

/**
 * The adapter against SendByte's documented contract.
 *
 * Stubbed, not live: these pin the mapping between our interface and the
 * shapes docs.sendbyte.africa specifies -- the bearer header, the snake_case
 * body, the 201 envelope, and the `{ error: { code, message } }` failure
 * shape. A live check belongs with a real key and a verified domain, which is
 * what the sandbox mode is for.
 */

const FROM = { email: "noreply@formdrop.co", name: "FormDrop" };

const INPUT: SendEmailInput = {
  to: { email: "owner@example.test" },
  subject: "New submission for Contact",
  html: "<p>hello</p>",
  text: "hello",
};

function stubFetch(response: Response) {
  return vi.fn(async () => response) as unknown as typeof globalThis.fetch;
}

function accepted(
  body: unknown = { id: "em_01j", status: "queued", sandbox: true },
) {
  return new Response(JSON.stringify(body), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}

function failure(
  status: number,
  code: string,
  message: string,
  headers: HeadersInit = {},
) {
  return new Response(
    JSON.stringify({
      error: { code, message, docs_url: "https://docs.sendbyte.africa" },
    }),
    { status, headers: { "content-type": "application/json", ...headers } },
  );
}

describe("the SendByte adapter", () => {
  it("posts to /emails with a bearer key and the documented body", async () => {
    const fetch = stubFetch(accepted());
    const provider = sendByteProvider("sk_test_abc", FROM, { fetch });

    await provider.send(INPUT);

    const [url, init] = (
      fetch as unknown as { mock: { calls: [string, RequestInit][] } }
    ).mock.calls[0];

    expect(url).toBe("https://api.sendbyte.africa/v1/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).authorization).toBe(
      "Bearer sk_test_abc",
    );

    const body = JSON.parse(init.body as string);
    // Display-name format, which the docs give as the alternative to a bare
    // address and is what puts "FormDrop" in the recipient's client.
    expect(body.from).toBe("FormDrop <noreply@formdrop.co>");
    expect(body.to).toBe("owner@example.test");
    expect(body.subject).toBe("New submission for Contact");
    expect(body.html).toBe("<p>hello</p>");
    expect(body.text).toBe("hello");
  });

  it("returns the queued email's id as the message id", async () => {
    const provider = sendByteProvider("sk_test_abc", FROM, {
      fetch: stubFetch(accepted({ id: "em_01jXYZ", status: "queued" })),
    });

    // A 201 is acceptance into a queue, not delivery. The id is the handle
    // that makes the difference answerable later.
    await expect(provider.send(INPUT)).resolves.toEqual({
      messageId: "em_01jXYZ",
    });
  });

  it("sends snake_case reply_to and idempotency_key only when given", async () => {
    const withNeither = stubFetch(accepted());
    await sendByteProvider("sk_test_abc", FROM, { fetch: withNeither }).send(
      INPUT,
    );

    const bare = JSON.parse(
      (withNeither as unknown as { mock: { calls: [string, RequestInit][] } })
        .mock.calls[0][1].body as string,
    );
    expect(bare).not.toHaveProperty("reply_to");
    expect(bare).not.toHaveProperty("idempotency_key");

    const withBoth = stubFetch(accepted());
    await sendByteProvider("sk_test_abc", FROM, { fetch: withBoth }).send({
      ...INPUT,
      replyTo: { email: "support@formdrop.co" },
      idempotencyKey: "submission:s1:owner@example.test",
    });

    const full = JSON.parse(
      (withBoth as unknown as { mock: { calls: [string, RequestInit][] } }).mock
        .calls[0][1].body as string,
    );
    expect(full.reply_to).toBe("support@formdrop.co");
    expect(full.idempotency_key).toBe("submission:s1:owner@example.test");
  });

  it("leads a failure with the error code, which is the stable half", async () => {
    const provider = sendByteProvider("sk_live_abc", FROM, {
      fetch: stubFetch(
        failure(
          403,
          "domain_not_verified",
          "The sending domain has not been verified.",
        ),
      ),
    });

    // SendByte's own guidance is to branch on code rather than message, and
    // the code is what somebody reading email_deliveries will search for.
    await expect(provider.send(INPUT)).rejects.toThrow(
      /domain_not_verified: The sending domain has not been verified\./,
    );
  });

  it("carries the status onto the error", async () => {
    const provider = sendByteProvider("sk_live_abc", FROM, {
      fetch: stubFetch(failure(422, "validation_error", "subject is required")),
    });

    await expect(provider.send(INPUT)).rejects.toMatchObject({
      provider: "sendbyte",
      status: 422,
    });
  });

  it("keeps the Retry-After value off a 429", async () => {
    const provider = sendByteProvider("sk_live_abc", FROM, {
      fetch: stubFetch(
        failure(429, "rate_limit_exceeded", "Too many requests", {
          "retry-after": "30",
        }),
      ),
    });

    // The server already stated the wait. Dropping it would leave the worker's
    // backoff guessing at a number it was given.
    await expect(provider.send(INPUT)).rejects.toThrow(/retry after 30s/);
  });

  it("still reports a status when the body is not SendByte's envelope", async () => {
    const provider = sendByteProvider("sk_live_abc", FROM, {
      fetch: stubFetch(
        new Response("<html>502 Bad Gateway</html>", { status: 502 }),
      ),
    });

    // A proxy between us and them answers in HTML. That is not a reason to
    // throw away the one fact the response does carry.
    await expect(provider.send(INPUT)).rejects.toThrow(/HTTP 502/);
  });

  it("wraps a transport failure rather than leaking a bare TypeError", async () => {
    const provider = sendByteProvider("sk_live_abc", FROM, {
      fetch: vi.fn(async () => {
        throw new TypeError("fetch failed");
      }) as unknown as typeof globalThis.fetch,
    });

    // Unwrapped, this reaches the delivery log as "fetch failed" with no
    // provider attached to it.
    const error = await provider.send(INPUT).catch((e) => e);
    expect(error).toBeInstanceOf(EmailSendError);
    expect(error.provider).toBe("sendbyte");
    expect(error.message).toMatch(/Request to SendByte failed: fetch failed/);
  });

  it("honours a base URL override, for sandbox and for tests", async () => {
    const fetch = stubFetch(accepted());
    await sendByteProvider("sk_test_abc", FROM, {
      fetch,
      baseUrl: "https://api.sendbyte.test/v1/",
    }).send(INPUT);

    // Trailing slash trimmed, so the override cannot produce a double slash.
    const [url] = (
      fetch as unknown as { mock: { calls: [string, RequestInit][] } }
    ).mock.calls[0];
    expect(url).toBe("https://api.sendbyte.test/v1/emails");
  });
});
