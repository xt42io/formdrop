import { afterAll, describe, expect, it } from "vitest";
import { FormDrop } from "./client.js";
import { FormDropAuthError, FormDropNotFoundError } from "./errors.js";

/**
 * The SDK against a real API (PRD W8: "Contract tests run against a live
 * staging API in CI, so an API change breaks the SDK build rather than
 * users").
 *
 * Everything else in this package tests against a stubbed fetch, which pins
 * what the SDK *sends* and how it reads a response it was handed. That cannot
 * catch the failure this file exists for: the API changing a field name, a
 * status code or a response envelope, and the SDK carrying on happily against
 * a shape the server no longer returns.
 *
 * Excluded from `npm test` -- it needs network and credentials, and a unit
 * suite that fails when a staging box is down is a unit suite people learn to
 * ignore. Run by `npm run test:contract` in its own CI job.
 *
 * The staging API is the target, never production: this creates and deletes
 * real forms.
 */
const baseUrl = process.env.FORMDROP_STAGING_URL;
const apiKey = process.env.FORMDROP_STAGING_KEY;

const live = baseUrl && apiKey ? describe : describe.skip;

live("the live API still matches what the SDK expects", () => {
  const fd = new FormDrop({ apiKey: apiKey!, baseUrl: baseUrl! });

  // Named so a leaked row is obviously this suite's and obviously disposable.
  const slugsToClean: string[] = [];

  afterAll(async () => {
    // Best effort. A form left behind on staging is untidy, not broken, and
    // failing the run over cleanup would hide the result that matters.
    for (const slug of slugsToClean) {
      await fd.forms.delete(slug).catch(() => {});
    }
  });

  it("creates a form and returns the fields the SDK's type claims", async () => {
    const form = await fd.forms.create({
      name: `contract-test-${Date.now()}`,
    });
    slugsToClean.push(form.slug);

    // Not a snapshot: the API is free to add fields, and a test that fails on
    // an addition would make every additive change look like a break.
    expect(typeof form.id).toBe("string");
    expect(typeof form.slug).toBe("string");
    expect(typeof form.name).toBe("string");
    expect(typeof form.createdAt).toBe("string");
  });

  it("lists the form it just created", async () => {
    const forms = await fd.forms.list();

    expect(Array.isArray(forms)).toBe(true);
    expect(forms.some((form) => form.slug === slugsToClean[0])).toBe(true);
  });

  it("collects a submission and reads it back through the SDK", async () => {
    const slug = slugsToClean[0];

    // The public path, with no key -- the one endpoint that must never break.
    await FormDrop.submit(
      slug,
      { email: "contract@example.test", message: "hello" },
      { baseUrl: baseUrl! },
    );

    const page = await fd.forms.submissions.list(slug, { limit: 10 });

    expect(Array.isArray(page.data)).toBe(true);
    // nextCursor is null rather than absent on the last page, and the paging
    // loop in the docs depends on that distinction.
    expect(page.nextCursor === null || typeof page.nextCursor === "string").toBe(
      true,
    );

    const mine = page.data.find(
      (submission) =>
        (submission.payload as Record<string, unknown>)?.email ===
        "contract@example.test",
    );
    expect(mine).toBeDefined();
  });

  it("still answers a missing form with the error class the SDK maps to", async () => {
    // Error mapping is a contract too. If the API started returning 400 here,
    // every `catch (e) { if (e instanceof FormDropNotFoundError) }` in the
    // wild would quietly stop matching.
    await expect(fd.forms.get("no-such-form-contract-test")).rejects.toThrow(
      FormDropNotFoundError,
    );
  });

  it("still answers a bad key with an auth error", async () => {
    const wrong = new FormDrop({ apiKey: "fd_live_definitely_not_a_key", baseUrl: baseUrl! });

    await expect(wrong.forms.list()).rejects.toThrow(FormDropAuthError);
  });
});
