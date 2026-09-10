# @formdrop/react

React hooks for FormDrop. A thin layer over [`@formdrop/js`](../js) — the
request, the retries and the typed errors all come from there.

```bash
npm i @formdrop/react
```

React 18 or 19. No API key: submitting is a public call, so nothing secret
ships to the browser.

## The hook

```tsx
import { useFormDrop } from "@formdrop/react";

function ContactForm() {
  const { submit, isSubmitting, isSuccess, error, reset } =
    useFormDrop("your-form-slug");

  if (isSuccess) {
    return (
      <p>
        Thanks. <button onClick={reset}>Send another</button>
      </p>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget));
      }}
    >
      <input name="email" type="email" required />
      <textarea name="message" />
      {error && <p role="alert">{error.message}</p>}
      <button disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
```

`submit` resolves rather than throwing — a hook cannot throw somewhere a
component could catch it, so failures arrive as `error`.

## The wrapper

For when the form is just a form:

```tsx
import { FormDropForm } from "@formdrop/react";

<FormDropForm slug="your-form-slug">
  {({ isSubmitting, isSuccess, error }) => (
    <>
      <input name="email" type="email" required />
      {error && <p role="alert">{error.message}</p>}
      {isSuccess && <p>Thanks</p>}
      <button disabled={isSubmitting}>Send</button>
    </>
  )}
</FormDropForm>;
```

It handles `onSubmit`, serialises the fields with `FormData`, clears the form
on success — and only on success, so a failed submit does not throw away what
somebody typed.

### The honeypot

`FormDropForm` includes a hidden field that bots fill in and people do not. A
submission arriving with it filled is dropped silently: telling a bot it was
caught teaches whoever runs it to leave the field alone.

The field is never sent to the API — it is ours, not part of your data. It is
also kept out of the accessibility tree and the tab order, so a screen reader
user is never offered a trap that would discard their submission.

Turn it off with `honeypot={false}` if you have your own spam handling.

## Errors

The error classes are re-exported, so you do not need `@formdrop/js`
installed separately to branch on them:

```tsx
import { FormDropRateLimitError } from "@formdrop/react";

const { error } = useFormDrop("contact");
if (error instanceof FormDropRateLimitError) {
  // error.retryAfterSeconds
}
```

## Options

```tsx
useFormDrop("slug", {
  baseUrl,    // defaults to https://api.formdrop.co
  retries,    // defaults to 2
  onSuccess,
  onError,
});
```

## Behaviour worth knowing

- **Submitting twice** — if a form is sent again before the first answer
  arrives, the newer submit owns the result. A slow first response cannot
  overwrite it.
- **Unmounting** — a form inside a dialog that closes mid-request will not set
  state after it is gone.
- **`submit` is stable** across renders, so it is safe in a dependency array
  even when `onSuccess` is an inline arrow.
