import { beforeEach, describe, expect, it, vi } from "vitest";

const insertValues = vi.fn();

// The delivery log writes to Postgres. What is being tested is which row gets
// written, not that Drizzle can write it.
vi.mock("@formdrop/db", () => ({
  db: { insert: () => ({ values: (...a: unknown[]) => insertValues(...a) }) },
}));
vi.mock("@formdrop/db/schema", () => ({ emailDeliveries: {} }));

const { sendEmail, setEmailProvider, getEmailProvider, EmailSendError } =
  await import("./index.ts");
type SendEmailInput = import("./provider.ts").SendEmailInput;
const { NewSubmissionEmail } = await import("./templates/new-submission.tsx");
const { OtpEmail } = await import("./templates/otp.tsx");

function stubProvider(behaviour: "ok" | "throw" = "ok") {
  // Typed parameter so mock.calls carries it; an inferred zero-arity stub
  // makes every read of the recorded argument a cast through unknown.
  const send = vi.fn(async (_input: SendEmailInput) => {
    if (behaviour === "throw") {
      throw new EmailSendError("stub", "provider said no");
    }
    return { messageId: "msg_1" };
  });

  setEmailProvider({ name: "stub", send });
  return send;
}

beforeEach(() => {
  vi.clearAllMocks();
  setEmailProvider(null);
  delete process.env.EMAIL_PROVIDER;
});

describe("sendEmail", () => {
  it("renders the template to both html and text", async () => {
    const send = stubProvider();

    await sendEmail({
      to: "someone@example.test",
      subject: "Your FormDrop sign-in code",
      templateName: "otp",
      template: OtpEmail({ code: "483920", expiresInMinutes: 25 }),
    });

    const [input] = send.mock.calls[0];

    expect(input.html).toContain("483920");
    // The text part is not optional in the interface: a message with no text
    // alternative scores worse with spam filters and some clients preview it.
    expect(input.text).toContain("483920");
    expect(input.html).toContain("<");
    expect(input.text).not.toContain("<div");
    expect(input.to.email).toBe("someone@example.test");
  });

  it("writes a sent row with the provider's message id", async () => {
    stubProvider();

    await sendEmail({
      to: "owner@example.test",
      subject: "New submission for Contact",
      templateName: "new_submission",
      userId: "u1",
      template: NewSubmissionEmail({ formName: "Contact", payload: {} }),
    });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        template: "new_submission",
        recipient: "owner@example.test",
        provider: "stub",
        status: "sent",
        providerMessageId: "msg_1",
        error: null,
      }),
    );
  });

  it("writes a failed row and still throws", async () => {
    stubProvider("throw");

    await expect(
      sendEmail({
        to: "owner@example.test",
        subject: "New submission for Contact",
        templateName: "new_submission",
        template: NewSubmissionEmail({ formName: "Contact", payload: {} }),
      }),
    ).rejects.toThrow(EmailSendError);

    // The whole point of W7's delivery log: a failure that leaves no trace is
    // what makes "did my notification go out?" unanswerable today.
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        providerMessageId: null,
        error: "provider said no",
      }),
    );
  });

  it("does not turn a delivered email into an error when the log write fails", async () => {
    stubProvider();
    insertValues.mockRejectedValueOnce(new Error("db down"));

    await expect(
      sendEmail({
        to: "owner@example.test",
        subject: "hello",
        templateName: "otp",
        template: OtpEmail({ code: "111111", expiresInMinutes: 25 }),
      }),
    ).resolves.toMatchObject({ messageId: "msg_1" });
  });
});

describe("the new-submission template", () => {
  it("escapes a submitted value instead of rendering it as markup", async () => {
    const send = stubProvider();

    await sendEmail({
      to: "owner@example.test",
      subject: "New submission for Contact",
      templateName: "new_submission",
      template: NewSubmissionEmail({
        formName: "Contact",
        payload: { message: "<img src=x onerror=alert(1)>" },
      }),
    });

    const [input] = send.mock.calls[0];

    // The inline HTML this replaced interpolated values into a string, so a
    // field containing a tag put that tag in the form owner's mail client.
    expect(input.html).not.toContain("<img src=x");
    expect(input.html).toContain("&lt;img");
  });

  it("says so when a submission arrived with no fields", async () => {
    const send = stubProvider();

    await sendEmail({
      to: "owner@example.test",
      subject: "New submission for Contact",
      templateName: "new_submission",
      template: NewSubmissionEmail({ formName: "Contact", payload: {} }),
    });

    const [input] = send.mock.calls[0];

    // An empty grey box reads as a broken email rather than an empty form.
    expect(input.text).toContain("no fields");
  });
});

describe("provider selection", () => {
  it("refuses a provider name it does not know", () => {
    process.env.EMAIL_PROVIDER = "mailgun";

    // Falling back to a default here is how a cutover looks like it worked.
    expect(() => getEmailProvider()).toThrow(/not a provider/);
  });

  it("refuses to send through SendByte until its contract exists", async () => {
    process.env.EMAIL_PROVIDER = "sendbyte";

    const provider = getEmailProvider();
    expect(provider.name).toBe("sendbyte");

    // D3 is outstanding. An adapter guessed at would pass a test written
    // against the same guess and fail on the real API.
    await expect(
      provider.send({
        to: { email: "a@b.test" },
        subject: "s",
        html: "",
        text: "",
      }),
    ).rejects.toThrow(/not implemented/);
  });
});
