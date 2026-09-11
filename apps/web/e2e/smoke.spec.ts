import { expect, test } from "@playwright/test";
import { API_URL } from "./env";
import { readVerificationOtp } from "./otp";

/**
 * The PRD's smoke path: signup -> create form -> submit -> see submission.
 *
 * One account and one form are shared across the steps, so they run in order
 * in a single worker. Splitting them would mean signing up four times.
 *
 * This used to be blocked on Polar. `createCustomerOnSignUp` re-throws a
 * failed customer creation as a 500, so signup failed outright without a
 * working token -- on a fresh clone as much as in CI. The app now registers
 * the billing plugin only when a token is configured, so the path below runs
 * without one and billing is unchanged wherever one exists.
 */

// A fresh identity per run, so a re-run never collides with the last one's rows.
const stamp = Date.now();
const email = `e2e-${stamp}@formdrop.test`;
const password = "e2e-Password-1";
const formName = `E2E Smoke ${stamp}`;

// Captured in the create step and read by the two that follow it.
let formSlug: string;

test.describe.configure({ mode: "serial" });

test.describe("smoke path", () => {
  test("signs up and verifies the email", async ({ page }) => {
    await page.goto("/signup");

    await page.locator("#name").fill("E2E Smoke");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#confirm-password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    // Signup redirects to /verify-email?email=... and the code is emailed.
    // With no mail server in the loop, the suite reads what better-auth wrote.
    await expect(page).toHaveURL(/\/verify-email/);

    const otp = await readVerificationOtp(email);
    await page.locator("#otp").fill(otp);
    await page.getByRole("button", { name: "Verify Email" }).click();

    // Verification hands off to /login rather than signing the user in.
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in and reaches the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/app/);
  });

  test("creates a form", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/app/);

    await page.goto("/app/forms");
    // "Create Form" once forms exist, "Create New Form" in the empty state.
    await page
      .getByRole("button", { name: /^create (new )?form$/i })
      .first()
      .click();

    // The dialog is addressable by role because the shared Modal announces
    // itself as one; the hand-rolled shells it replaced did not.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("e.g. Contact Us").fill(formName);
    await dialog.getByRole("button", { name: "Create Form" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText(formName)).toBeVisible();

    // The slug is what the collect endpoint is addressed by, and the UI only
    // shows it inside a code sample pinned to the production host. Reading it
    // from the app's own authenticated API is both easier and less brittle
    // than scraping that snippet.
    const response = await page.request.get("/api/forms");
    expect(response.ok()).toBeTruthy();

    const { forms } = (await response.json()) as {
      forms: Array<{ name: string; slug: string }>;
    };
    const created = forms.find((form) => form.name === formName);
    expect(
      created,
      `form "${formName}" is missing from GET /api/forms`,
    ).toBeDefined();

    formSlug = created!.slug;
    expect(formSlug).toBeTruthy();
  });

  test("collects a submission and shows it on the form", async ({ page }) => {
    expect(formSlug, "the create step did not record a slug").toBeTruthy();

    // Posted to the API server directly, the way a real form on a customer's
    // site would -- not through the dashboard.
    const submission = await page.request.post(`${API_URL}/f/${formSlug}`, {
      form: {
        email: "visitor@example.com",
        message: `submitted by the smoke path at ${stamp}`,
      },
    });
    expect(
      submission.ok(),
      `POST /f/${formSlug} returned ${submission.status()}`,
    ).toBeTruthy();

    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/app/);

    // A form card links straight to its submissions tab.
    await page.goto("/app/forms");
    await page.getByText(formName).click();
    await expect(page).toHaveURL(/\/app\/forms\/[^/]+\/submissions/);

    await expect(page.getByText("visitor@example.com")).toBeVisible();
    await expect(page.getByText("No submissions yet")).toBeHidden();
  });
});
