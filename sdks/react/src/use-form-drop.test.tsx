import { describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useFormDrop } from "./use-form-drop.js";
import { FormDropForm, HONEYPOT_FIELD } from "./form-drop-form.js";
import { FormDropValidationError } from "@formdrop/js";

const BASE = "https://api.test";

const ok = (submissionId = "s1") =>
  new Response(
    JSON.stringify({ success: true, submissionId, message: "Submission received" }),
    { status: 201, headers: { "content-type": "application/json" } },
  );

const bad = () =>
  new Response(JSON.stringify({ error: "No submission data found" }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });

/** A fetch whose resolution the test controls. */
function deferredFetch() {
  const resolvers: Array<(r: Response) => void> = [];
  const impl = (() =>
    new Promise<Response>((resolve) => {
      resolvers.push(resolve);
    })) as unknown as typeof globalThis.fetch;
  return { impl, resolvers };
}

describe("useFormDrop", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useFormDrop("contact", { baseUrl: BASE }));

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it("reports success and the API's answer", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok("abc"));
    const { result } = renderHook(() =>
      useFormDrop("contact", { baseUrl: BASE, fetch: fetchImpl as never }),
    );

    await act(async () => {
      await result.current.submit({ email: "a@b.c" });
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.data?.submissionId).toBe("abc");
    expect(result.current.error).toBeNull();
  });

  it("reports a typed error rather than throwing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(bad());
    const { result } = renderHook(() =>
      useFormDrop("contact", { baseUrl: BASE, fetch: fetchImpl as never, retries: 0 }),
    );

    // A hook cannot throw asynchronously anywhere a caller could catch it,
    // so the error has to be readable state.
    await act(async () => {
      await expect(result.current.submit({})).resolves.toBeNull();
    });

    expect(result.current.error).toBeInstanceOf(FormDropValidationError);
    expect(result.current.error?.message).toBe("No submission data found");
    expect(result.current.isSuccess).toBe(false);
  });

  it("calls onSuccess and onError", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const good = renderHook(() =>
      useFormDrop("contact", {
        baseUrl: BASE,
        fetch: vi.fn().mockResolvedValue(ok()) as never,
        onSuccess,
      }),
    );
    await act(async () => {
      await good.result.current.submit({});
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);

    const failing = renderHook(() =>
      useFormDrop("contact", {
        baseUrl: BASE,
        fetch: vi.fn().mockResolvedValue(bad()) as never,
        onError,
      }),
    );
    await act(async () => {
      await failing.result.current.submit({});
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("keeps a stable submit across renders", () => {
    // An inline arrow in options must not change submit's identity, or every
    // effect depending on it re-runs forever.
    const { result, rerender } = renderHook(() =>
      useFormDrop("contact", { baseUrl: BASE, onSuccess: () => {} }),
    );

    const first = result.current.submit;
    rerender();
    expect(result.current.submit).toBe(first);
  });

  it("ignores an outdated response when submitted twice", async () => {
    const { impl, resolvers } = deferredFetch();
    const { result } = renderHook(() =>
      useFormDrop("contact", { baseUrl: BASE, fetch: impl }),
    );

    let firstDone: Promise<unknown> | undefined;
    let secondDone: Promise<unknown> | undefined;

    await act(async () => {
      firstDone = result.current.submit({ n: 1 });
      secondDone = result.current.submit({ n: 2 });
      // The second call answers first, then the stale first arrives.
      resolvers[1](ok("second"));
      resolvers[0](ok("first"));
      await Promise.all([firstDone, secondDone]);
    });

    // Whichever lands last must not win: the newest submit owns the state.
    expect(result.current.data?.submissionId).toBe("second");
  });

  it("does not set state after unmount", async () => {
    const { impl, resolvers } = deferredFetch();
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((e) => errors.push(e));

    const { result, unmount } = renderHook(() =>
      useFormDrop("contact", { baseUrl: BASE, fetch: impl }),
    );

    let pending: Promise<unknown> | undefined;
    act(() => {
      pending = result.current.submit({});
    });

    unmount();

    await act(async () => {
      resolvers[0](ok());
      await pending;
    });

    // A form inside a dialog that closes mid-request is the ordinary case.
    expect(errors).toHaveLength(0);
    spy.mockRestore();
  });

  it("reset clears the state and invalidates what is in flight", async () => {
    const { impl, resolvers } = deferredFetch();
    const { result } = renderHook(() =>
      useFormDrop("contact", { baseUrl: BASE, fetch: impl }),
    );

    let pending: Promise<unknown> | undefined;
    act(() => {
      pending = result.current.submit({});
    });

    act(() => {
      result.current.reset();
    });

    await act(async () => {
      resolvers[0](ok());
      await pending;
    });

    // A late response must not revive what a reset just cleared.
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });
});

describe("FormDropForm", () => {
  it("serialises the fields and submits them", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());

    render(
      <FormDropForm slug="contact" options={{ baseUrl: BASE, fetch: fetchImpl as never }}>
        <input name="email" defaultValue="a@b.c" readOnly />
        <button type="submit">Send</button>
      </FormDropForm>,
    );

    screen.getByText("Send").click();

    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    const body = fetchImpl.mock.calls[0][1].body as FormData;
    expect(body.get("email")).toBe("a@b.c");
  });

  it("never sends the honeypot field", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());

    render(
      <FormDropForm slug="contact" options={{ baseUrl: BASE, fetch: fetchImpl as never }}>
        <input name="email" defaultValue="a@b.c" readOnly />
        <button type="submit">Send</button>
      </FormDropForm>,
    );

    screen.getByText("Send").click();
    await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));

    // It is our field, not the customer's, and has no business in their data.
    const body = fetchImpl.mock.calls[0][1].body as FormData;
    expect(body.has(HONEYPOT_FIELD)).toBe(false);
    expect(body.get("email")).toBe("a@b.c");
  });

  it("silently drops a submission with the honeypot filled", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());

    const { container } = render(
      <FormDropForm slug="contact" options={{ baseUrl: BASE, fetch: fetchImpl as never }}>
        <input name="email" defaultValue="a@b.c" readOnly />
        <button type="submit">Send</button>
      </FormDropForm>,
    );

    const trap = container.querySelector<HTMLInputElement>(
      `[name="${HONEYPOT_FIELD}"]`,
    );
    expect(trap).not.toBeNull();
    trap!.value = "http://spam.example";

    screen.getByText("Send").click();

    // Nothing is sent, and nothing says so. Telling a bot it was caught
    // teaches whoever runs it to leave the field alone.
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("keeps the honeypot out of the accessibility tree and the tab order", () => {
    const { container } = render(
      <FormDropForm slug="contact" options={{ baseUrl: BASE }}>
        <input name="email" />
      </FormDropForm>,
    );

    const trap = container.querySelector<HTMLInputElement>(
      `[name="${HONEYPOT_FIELD}"]`,
    );
    // A screen reader user must never be offered a trap that would silently
    // discard their submission.
    expect(trap!.tabIndex).toBe(-1);
    expect(trap!.closest("[aria-hidden='true']")).not.toBeNull();
    expect(trap!.getAttribute("autocomplete")).toBe("off");
  });

  it("can be turned off", () => {
    const { container } = render(
      <FormDropForm slug="contact" honeypot={false} options={{ baseUrl: BASE }}>
        <input name="email" />
      </FormDropForm>,
    );

    expect(container.querySelector(`[name="${HONEYPOT_FIELD}"]`)).toBeNull();
  });

  it("exposes the state to children as a function", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());

    render(
      <FormDropForm slug="contact" options={{ baseUrl: BASE, fetch: fetchImpl as never }}>
        {({ isSuccess }) => (
          <>
            <button type="submit">Send</button>
            {isSuccess && <p>Thanks</p>}
          </>
        )}
      </FormDropForm>,
    );

    screen.getByText("Send").click();
    await waitFor(() => expect(screen.getByText("Thanks")).toBeTruthy());
  });
});
