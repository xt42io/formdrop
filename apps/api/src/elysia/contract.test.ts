import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_KEY_LIMIT } from "@formdrop/core";

/**
 * Contract tests for the legacy paths (PRD W2 acceptance).
 *
 * The acceptance asks for "byte-compatible responses, proven by contract tests
 * against the Express implementation". Express is deleted, so there is nothing
 * live to diff against -- and to be plain about it, that is a weaker test than
 * the PRD intended. What these do instead is pin the exact status codes and
 * bodies the Express handlers returned, read out of git history at 69c3c35^
 * (the commit before the deletion) and quoted in each case below.
 *
 * That still catches the failure that matters: a change to Elysia silently
 * altering a response somebody's integration depends on. It does not catch a
 * shape Express produced that nobody wrote down here.
 *
 * No database. `@formdrop/core/data` is mocked, so this runs anywhere and
 * tests the HTTP contract rather than the queries underneath it.
 */

const findApiKeyByValue = vi.fn();
const touchApiKeyLastUsed = vi.fn().mockResolvedValue(undefined);
const findOwnedForm = vi.fn();
const listFormsForApiKey = vi.fn();
const listAllSubmissionsForForm = vi.fn();
const findSubmissionsInForm = vi.fn();
const findSubmissionInForm = vi.fn();
const softDeleteForm = vi.fn();
const softDeleteSubmission = vi.fn();
const softDeleteSubmissions = vi.fn();
const findFormBySlug = vi.fn();
const findFormOwnerEmail = vi.fn();
const listDeliverableRecipients = vi.fn();
const recordSubmission = vi.fn();

/*
 * vi.mock replaces the module wholesale, so every name the routes import has
 * to appear here -- a missing one is `undefined` at call time and the handler
 * answers 500. The first run of this suite did exactly that, and the 500s
 * looked like route bugs rather than a gap in the fixture.
 */
vi.mock("@formdrop/core/data", () => ({
  findApiKeyByValue: (...a: unknown[]) => findApiKeyByValue(...a),
  touchApiKeyLastUsed: (...a: unknown[]) => touchApiKeyLastUsed(...a),
  findOwnedForm: (...a: unknown[]) => findOwnedForm(...a),
  listFormsForApiKey: (...a: unknown[]) => listFormsForApiKey(...a),
  listAllSubmissionsForForm: (...a: unknown[]) =>
    listAllSubmissionsForForm(...a),
  findSubmissionsInForm: (...a: unknown[]) => findSubmissionsInForm(...a),
  findSubmissionInForm: (...a: unknown[]) => findSubmissionInForm(...a),
  softDeleteForm: (...a: unknown[]) => softDeleteForm(...a),
  softDeleteSubmission: (...a: unknown[]) => softDeleteSubmission(...a),
  softDeleteSubmissions: (...a: unknown[]) => softDeleteSubmissions(...a),
  findFormBySlug: (...a: unknown[]) => findFormBySlug(...a),
  findFormOwnerEmail: (...a: unknown[]) => findFormOwnerEmail(...a),
  listDeliverableRecipients: (...a: unknown[]) =>
    listDeliverableRecipients(...a),
  recordSubmission: (...a: unknown[]) => recordSubmission(...a),
}));

const { createApp } = await import("./app");
const app = createApp();

const call = (path: string, init?: RequestInit) =>
  app.handle(new Request(`http://localhost${path}`, init));

const withKey = { authorization: "Bearer fd_live_test" };

/**
 * Fixture rows carry a real Date, because the handlers call .toISOString() on
 * createdAt before answering. A fixture without one throws inside the route
 * and comes back as a 500, which looks like a broken endpoint rather than a
 * thin fixture -- it cost me two red tests to notice.
 */
const CREATED = new Date("2026-01-15T09:30:00.000Z");

const formRow = {
  id: "f1",
  slug: "contact",
  name: "Contact form",
  description: null,
  createdAt: CREATED,
};

const submissionRow = {
  id: "s1",
  data: { email: "a@b.c" },
  createdAt: CREATED,
};

/** The response schema declares this a uuid, so the fixture must be one. */
const SUBMISSION_ID = "8f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";

/** A form with every notification channel switched on and configured. */
const collectForm = {
  ...formRow,
  userId: "u1",
  deletedAt: null,
  allowedDomains: null,
  emailNotificationsEnabled: true,
  slackNotificationsEnabled: true,
  slackWebhookUrl: "https://hooks.slack.test/x",
  slackChannelName: "#inbox",
  discordNotificationsEnabled: false,
  discordWebhookUrl: null,
  discordChannelName: null,
  googleSheetsEnabled: false,
  googleSheetsSpreadsheetId: null,
  googleSheetsAccessToken: null,
  googleSheetsRefreshToken: null,
  googleSheetsTokenExpiry: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  touchApiKeyLastUsed.mockResolvedValue(undefined);
});

describe("POST /f/:slug -- queues delivery instead of firing it (D8)", () => {
  beforeEach(() => {
    findFormBySlug.mockResolvedValue(collectForm);
    findFormOwnerEmail.mockResolvedValue("owner@example.com");
    listDeliverableRecipients.mockResolvedValue([
      { email: "team@example.com" },
    ]);
    recordSubmission.mockResolvedValue({ id: SUBMISSION_ID });
  });

  const post = () =>
    call("/f/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "visitor@example.com" }),
    });

  it("still answers 201 with the submission id", async () => {
    const res = await post();
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      success: true,
      submissionId: SUBMISSION_ID,
      message: "Submission received",
    });
  });

  it("hands the planned rows to the same transaction as the submission", async () => {
    await post();

    // The point of D8: the rows are an argument to the write, so they commit
    // with it. Anything that sent from the route instead would leave no trace
    // here.
    expect(recordSubmission).toHaveBeenCalledTimes(1);
    const [input] = recordSubmission.mock.calls[0] as [
      { deliveries: Array<{ channel: string; target: string }> },
    ];

    expect(input.deliveries).toEqual([
      { channel: "email", target: "owner@example.com" },
      { channel: "email", target: "team@example.com" },
      { channel: "slack", target: "https://hooks.slack.test/x" },
    ]);
  });

  it("queues nothing when the form has no channel configured", async () => {
    findFormBySlug.mockResolvedValue({
      ...collectForm,
      emailNotificationsEnabled: false,
      slackNotificationsEnabled: false,
    });

    await post();

    const [input] = recordSubmission.mock.calls[0] as [
      { deliveries: unknown[] },
    ];
    expect(input.deliveries).toEqual([]);
  });
});

describe("GET / -- the health check Express served at the root", () => {
  it('returns { message: "FormDrop API v1.0" } at 200', async () => {
    // Express: res.json({ message: "FormDrop API v1.0" })
    const res = await call("/");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "FormDrop API v1.0" });
  });
});

describe("authentication on the legacy paths", () => {
  it("rejects a missing key with Express's exact wording", async () => {
    // Express: res.status(401).json({ error: "API key required in Authorization header" })
    const res = await call("/forms");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: "API key required in Authorization header",
    });
  });

  it("rejects an unknown key with Express's exact wording", async () => {
    // Express: res.status(401).json({ error: "Invalid API key" })
    findApiKeyByValue.mockResolvedValue(undefined);
    const res = await call("/forms", { headers: withKey });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid API key" });
  });

  it("does not make the caller wait on the last-used write", async () => {
    // Express awaited this on every authenticated request. Nothing reads it
    // synchronously, so a slow write must not become a slow response.
    findApiKeyByValue.mockResolvedValue({ id: "k1", userId: "u1" });
    listFormsForApiKey.mockResolvedValue([]);

    let settle: () => void = () => {};
    touchApiKeyLastUsed.mockReturnValue(
      new Promise<void>((resolve) => {
        settle = resolve;
      }),
    );

    const res = await call("/forms", { headers: withKey });
    expect(res.status).toBe(200);
    settle();
  });
});

describe("GET /forms -- was the authenticated forms list", () => {
  it("wraps the rows in { forms }", async () => {
    // Express: res.json({ forms: userForms })
    findApiKeyByValue.mockResolvedValue({ id: "k1", userId: "u1" });
    listFormsForApiKey.mockResolvedValue([formRow]);

    const res = await call("/forms", { headers: withKey });
    expect(res.status).toBe(200);
    // Express returned the rows as-is; the port serialises createdAt to an
    // ISO string, which is what JSON.stringify did to the Date anyway.
    expect(await res.json()).toEqual({
      forms: [{ ...formRow, createdAt: CREATED.toISOString() }],
    });
  });
});

describe("GET /:slug/submissions -- the legacy submissions list", () => {
  it("404s an unknown form with Express's body", async () => {
    // Express: res.status(404).json({ error: "Form not found" })
    findApiKeyByValue.mockResolvedValue({ id: "k1", userId: "u1" });
    findOwnedForm.mockResolvedValue(undefined);

    const res = await call("/nope/submissions", { headers: withKey });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Form not found" });
  });

  it("wraps the rows in { submissions }", async () => {
    // Express: res.json({ submissions: formSubmissions })
    findApiKeyByValue.mockResolvedValue({ id: "k1", userId: "u1" });
    findOwnedForm.mockResolvedValue({ ...formRow, userId: "u1" });
    listAllSubmissionsForForm.mockResolvedValue([submissionRow]);

    const res = await call("/contact/submissions", { headers: withKey });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      submissions: [{ ...submissionRow, createdAt: CREATED.toISOString() }],
    });
  });
});

describe("CORS -- wide open only where it should be", () => {
  /*
   * Express applied cors({ origin: "*" }) to the whole API, including the
   * API-key routes, which means any page on any origin could read an
   * authenticated response with a stolen key. The port narrows that to the two
   * endpoints that genuinely need it, and this is the test that keeps it
   * narrow -- it is the one place these contract tests deliberately do NOT
   * match Express.
   */
  it("lets any origin post a submission, without credentials", async () => {
    const res = await call("/f/contact", {
      method: "OPTIONS",
      headers: {
        origin: "https://somebody-elses-site.example",
        "access-control-request-method": "POST",
      },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "https://somebody-elses-site.example",
    );
    // The half that is easy to lose: reflecting an origin while allowing
    // credentials is more open than the wildcard Express sent, because a
    // wildcard cannot carry cookies at all.
    expect(res.headers.get("access-control-allow-credentials")).not.toBe(
      "true",
    );
  });

  it("lets any origin read health, without credentials", async () => {
    const res = await call("/health", {
      headers: { origin: "https://somebody-elses-site.example" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "https://somebody-elses-site.example",
    );
    expect(res.headers.get("access-control-allow-credentials")).not.toBe(
      "true",
    );
  });

  it("gives the authenticated routes no cross-origin access at all", async () => {
    findApiKeyByValue.mockResolvedValue({ id: "k1", userId: "u1" });
    listFormsForApiKey.mockResolvedValue([]);

    const res = await call("/v1/forms", {
      headers: { ...withKey, origin: "https://somebody-elses-site.example" },
    });
    // Express sent "*" here, which is the bug the port set out to fix.
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("rate limiting on /v1 (W2: per-key)", () => {
  /*
   * A key of its own. The limiter is module state shared by every test in
   * this file, so exhausting the usual fixture key would leave the rest of
   * the suite refused -- an order-dependent failure that would be miserable
   * to track down.
   */
  const key = { authorization: "Bearer fd_live_ratelimit_probe" };

  it("answers 429 with a retry-after once the window is spent", async () => {
    findApiKeyByValue.mockResolvedValue({ id: "k1", userId: "u1" });
    listFormsForApiKey.mockResolvedValue([]);

    let refused: Response | undefined;

    // One past the limit. The exact ceiling lives in packages/core; this only
    // needs to prove the group is wired to it.
    for (let i = 0; i < API_KEY_LIMIT.limit + 1; i++) {
      const res = await call("/v1/forms", { headers: key });
      if (res.status === 429) {
        refused = res;
        break;
      }
    }

    expect(refused, "the limiter never refused a request").toBeDefined();
    expect(await refused!.json()).toEqual({ error: "Rate limit exceeded" });

    // Without this a client retries immediately and is refused again.
    expect(Number(refused!.headers.get("retry-after"))).toBeGreaterThanOrEqual(
      1,
    );
    expect(refused!.headers.get("x-ratelimit-remaining")).toBe("0");
  });
});
