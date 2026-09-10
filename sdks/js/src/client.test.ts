import { describe, expect, it } from "vitest";
import { FormDrop } from "./client.js";
import {
  FormDropAuthError,
  FormDropNetworkError,
  FormDropNotFoundError,
  FormDropRateLimitError,
  FormDropServerError,
  FormDropValidationError,
} from "./errors.js";

const BASE = "https://api.test";

/** A fetch that answers from a queue, and records what it was asked. */
function stubFetch(
  responses: Array<Response | Error>,
): typeof globalThis.fetch & { calls: Array<[string, RequestInit]> } {
  const calls: Array<[string, RequestInit]> = [];
  let i = 0;

  const impl = ((url: string, init: RequestInit) => {
    calls.push([String(url), init]);
    const next = responses[Math.min(i++, responses.length - 1)];
    return next instanceof Error
      ? Promise.reject(next)
      : Promise.resolve(next.clone());
  }) as unknown as typeof globalThis.fetch & {
    calls: Array<[string, RequestInit]>;
  };

  impl.calls = calls;
  return impl;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const client = (fetchImpl: typeof globalThis.fetch, retries = 0) =>
  new FormDrop({ apiKey: "fd_live_test", baseUrl: BASE, fetch: fetchImpl, retries });

describe("FormDrop.submit", () => {
  it("posts JSON to the collect endpoint without a key", async () => {
    const f = stubFetch([
      json({ success: true, submissionId: "s1", message: "Submission received" }, 201),
    ]);

    const result = await FormDrop.submit(
      "contact",
      { email: "a@b.c" },
      { baseUrl: BASE, fetch: f },
    );

    const [url, init] = f.calls[0];
    expect(url).toBe(`${BASE}/f/contact`);
    expect(init.method).toBe("POST");
    // The one public endpoint: sending a credential here would mean shipping
    // one to the browser.
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
    expect(init.body).toBe(JSON.stringify({ email: "a@b.c" }));
    expect(result.submissionId).toBe("s1");
  });

  it("sends FormData as-is, without forcing a content-type", async () => {
    const f = stubFetch([json({ success: true, submissionId: "s1", message: "ok" }, 201)]);
    const form = new FormData();
    form.set("email", "a@b.c");

    await FormDrop.submit("contact", form, { baseUrl: BASE, fetch: f });

    const [, init] = f.calls[0];
    expect(init.body).toBeInstanceOf(FormData);
    // The runtime has to set this, because it carries the multipart boundary.
    expect((init.headers as Record<string, string>)["content-type"]).toBeUndefined();
  });

  it("never sends the key even when the client has one", async () => {
    const f = stubFetch([json({ success: true, submissionId: "s1", message: "ok" }, 201)]);
    await client(f).submit("contact", { a: 1 });

    expect((f.calls[0][1].headers as Record<string, string>).authorization).toBeUndefined();
  });
});

describe("authenticated calls", () => {
  it("sends the key as a bearer token", async () => {
    const f = stubFetch([json({ forms: [] })]);
    await client(f).forms.list();

    expect((f.calls[0][1].headers as Record<string, string>).authorization).toBe(
      "Bearer fd_live_test",
    );
  });

  it("unwraps the envelope the API returns", async () => {
    const form = { id: "f1", name: "Contact", slug: "contact", description: null, createdAt: "2026-01-01T00:00:00.000Z" };
    const f = stubFetch([json({ forms: [form] })]);

    // The API answers { forms: [...] }; a caller wants the array.
    expect(await client(f).forms.list()).toEqual([form]);
  });

  it("fails locally when no key was configured, without a round trip", async () => {
    const f = stubFetch([json({ forms: [] })]);
    const anonymous = new FormDrop({ baseUrl: BASE, fetch: f });

    await expect(anonymous.forms.list()).rejects.toBeInstanceOf(FormDropAuthError);
    // The API could only have said 401; saying it here names the actual
    // mistake instead of echoing a generic answer.
    expect(f.calls).toHaveLength(0);
  });

  it("builds the paginated submissions URL", async () => {
    const f = stubFetch([json({ data: [], nextCursor: null })]);
    await client(f).forms.submissions.list("contact", { limit: 50, cursor: "abc" });

    expect(f.calls[0][0]).toBe(`${BASE}/v1/forms/contact/submissions?limit=50&cursor=abc`);
  });

  it("omits the query string entirely when nothing is set", async () => {
    const f = stubFetch([json({ data: [], nextCursor: null })]);
    await client(f).forms.submissions.list("contact");

    expect(f.calls[0][0]).toBe(`${BASE}/v1/forms/contact/submissions`);
  });

  it("encodes path segments", async () => {
    const f = stubFetch([json({ submission: {} })]);
    await client(f).forms.submissions.get("a/b", "id with space");

    // A stray slash would address a different endpoint entirely.
    expect(f.calls[0][0]).toBe(`${BASE}/v1/forms/a%2Fb/submissions/id%20with%20space`);
  });
});

describe("error normalisation", () => {
  const cases: Array<[number, unknown, new (...a: never[]) => Error]> = [
    [400, { error: "Invalid cursor" }, FormDropValidationError],
    [401, { error: "Invalid API key" }, FormDropAuthError],
    [404, { error: "Form not found" }, FormDropNotFoundError],
  ];

  for (const [status, body, type] of cases) {
    it(`maps ${status} to ${type.name}`, async () => {
      const f = stubFetch([json(body, status)]);
      await expect(client(f).forms.list()).rejects.toBeInstanceOf(type);
    });
  }

  it("carries the API's own message", async () => {
    const f = stubFetch([json({ error: "Form not found" }, 404)]);
    await expect(client(f).forms.list()).rejects.toThrow("Form not found");
  });

  it("survives a non-JSON error body", async () => {
    // A proxy's HTML 502 should not turn into a parse crash.
    const f = stubFetch([new Response("<html>502</html>", { status: 502 })]);
    await expect(client(f).forms.list()).rejects.toBeInstanceOf(FormDropServerError);
  });

  it("reports an unreachable host as a network error", async () => {
    const f = stubFetch([new TypeError("fetch failed")]);
    await expect(client(f).forms.list()).rejects.toBeInstanceOf(FormDropNetworkError);
  });
});

describe("retries", () => {
  it("retries a 500 and returns the eventual success", async () => {
    const f = stubFetch([json({ error: "boom" }, 500), json({ forms: [] })]);

    expect(await client(f, 2).forms.list()).toEqual([]);
    expect(f.calls).toHaveLength(2);
  });

  it("retries a 429 and surfaces retryAfterSeconds once exhausted", async () => {
    const limited = new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "1" },
    });
    const f = stubFetch([limited]);

    const error = await client(f, 1).forms.list().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(FormDropRateLimitError);
    expect((error as FormDropRateLimitError).retryAfterSeconds).toBe(1);
    expect(f.calls).toHaveLength(2);
  });

  it("does not retry a 4xx the caller has to fix", async () => {
    const f = stubFetch([json({ error: "Invalid API key" }, 401)]);

    await expect(client(f, 3).forms.list()).rejects.toBeInstanceOf(FormDropAuthError);
    // Retrying a bad credential just multiplies the failure.
    expect(f.calls).toHaveLength(1);
  });

  it("stops after the configured number of attempts", async () => {
    const f = stubFetch([json({ error: "boom" }, 500)]);

    await expect(client(f, 2).forms.list()).rejects.toBeInstanceOf(FormDropServerError);
    expect(f.calls).toHaveLength(3);
  });
});

describe("AbortSignal", () => {
  it("passes the signal to fetch", async () => {
    const f = stubFetch([json({ forms: [] })]);
    const controller = new AbortController();

    await client(f).forms.list({ signal: controller.signal });

    expect(f.calls[0][1].signal).toBe(controller.signal);
  });

  it("does not retry once aborted", async () => {
    const controller = new AbortController();
    const aborted = Object.assign(new Error("Aborted"), { name: "AbortError" });

    const f = ((url: string, init: RequestInit) => {
      calls++;
      controller.abort();
      void url;
      void init;
      return Promise.reject(aborted);
    }) as unknown as typeof globalThis.fetch;
    let calls = 0;

    await expect(
      new FormDrop({
        apiKey: "k",
        baseUrl: BASE,
        fetch: f,
        retries: 3,
      }).forms.list({ signal: controller.signal }),
    ).rejects.toBe(aborted);

    // An abort is an instruction, not a failure to try again past.
    expect(calls).toBe(1);
  });
});

describe("construction", () => {
  it("strips trailing slashes from the base URL", async () => {
    const f = stubFetch([json({ forms: [] })]);
    await new FormDrop({ apiKey: "k", baseUrl: `${BASE}///`, fetch: f }).forms.list();

    expect(f.calls[0][0]).toBe(`${BASE}/v1/forms`);
  });

  it("explains itself when no fetch exists", () => {
    expect(
      () => new FormDrop({ fetch: undefined as unknown as typeof globalThis.fetch }),
    ).not.toThrow();

    expect(
      () =>
        new FormDrop({
          fetch: "not a function" as unknown as typeof globalThis.fetch,
        }),
    ).toThrow(/Node 18\+/);
  });
});
