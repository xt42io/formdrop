import { describe, expectTypeOf, it } from "vitest";
import type {
  Form,
  Submission,
  SubmissionPage,
  SubmitResult,
} from "./types.ts";

/**
 * That the derived types still resolve to something.
 *
 * These exist because of the way this refactor failed the first time. The
 * helper originally hardcoded a 200 response, collect answers 201, and
 * `SubmitResult` silently became `never` -- which typechecks everywhere until
 * something dereferences it. A regeneration that moves a status code or
 * renames a path would do the same again, and `never` satisfies almost every
 * assertion you might write against it by accident.
 *
 * So each one is checked for a field it must have. If the derivation breaks,
 * this stops compiling rather than shipping a type that is quietly empty.
 */
describe("the types derived from the OpenAPI spec", () => {
  it("resolves Form to the form shape, not never", () => {
    expectTypeOf<Form>().not.toBeNever();
    expectTypeOf<Form>().toHaveProperty("slug");
    expectTypeOf<Form>().toHaveProperty("createdAt");
    // A date is a string over JSON. Declaring Date would be a lie the
    // compiler tells until somebody calls .getTime() on it.
    expectTypeOf<Form["createdAt"]>().toEqualTypeOf<string>();
  });

  it("resolves Submission through the page it comes in", () => {
    expectTypeOf<Submission>().not.toBeNever();
    expectTypeOf<Submission>().toHaveProperty("payload");
    expectTypeOf<Submission>().toHaveProperty("formId");
  });

  it("keeps nextCursor nullable, which the paging loop depends on", () => {
    expectTypeOf<SubmissionPage>().not.toBeNever();
    expectTypeOf<SubmissionPage>().toHaveProperty("data");
    // null on the last page rather than absent. The documented loop reads
    // `page.nextCursor ?? undefined`, which needs null to be in the type.
    expectTypeOf<SubmissionPage["nextCursor"]>().toEqualTypeOf<string | null>();
  });

  it("resolves SubmitResult off the 201, which is the case that broke", () => {
    expectTypeOf<SubmitResult>().not.toBeNever();
    expectTypeOf<SubmitResult>().toHaveProperty("submissionId");
  });
});
