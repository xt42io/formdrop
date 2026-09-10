# @formdrop/js

The official FormDrop client. Zero dependencies, ESM and CJS, browser and Node 18+.

```bash
npm i @formdrop/js
```

## Submit a form

No API key. This is the call a form on your own site makes.

```ts
import { FormDrop } from "@formdrop/js";

await FormDrop.submit("your-form-slug", { name, email });
```

A `FormData` works too, so an existing form is one line:

```ts
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await FormDrop.submit("your-form-slug", new FormData(form));
});
```

## Read your data

Needs an API key, so keep it on a server.

```ts
const fd = new FormDrop({ apiKey: process.env.FORMDROP_API_KEY });

const { data, nextCursor } = await fd.forms.submissions.list("contact", {
  limit: 50,
});
```

| | |
|---|---|
| `fd.forms.list()` | every form on the account |
| `fd.forms.create({ name })` | |
| `fd.forms.get(slug)` | |
| `fd.forms.delete(slug)` | |
| `fd.forms.submissions.list(slug, { limit, cursor })` | one page, newest first |
| `fd.forms.submissions.get(slug, id)` | |
| `fd.forms.submissions.delete(slug, id)` | |
| `fd.forms.submissions.deleteMany(slug, ids)` | |

Paging is by cursor. `nextCursor` is `null` on the last page; pass it back as
`cursor` to continue, and do not build one yourself — the encoding is the
API's business and will change.

## Errors

Every failure is a typed class, so you can branch on the problem rather than
on a status code.

```ts
import { FormDropRateLimitError, FormDropNotFoundError } from "@formdrop/js";

try {
  await fd.forms.get("contact");
} catch (error) {
  if (error instanceof FormDropNotFoundError) return null;
  if (error instanceof FormDropRateLimitError) {
    await wait(error.retryAfterSeconds ?? 60);
  }
  throw error;
}
```

`FormDropError` is the base. `FormDropAuthError`, `FormDropForbiddenError`,
`FormDropNotFoundError`, `FormDropValidationError`, `FormDropRateLimitError`
and `FormDropServerError` map to their statuses; `FormDropNetworkError` means
no response arrived at all.

## Retries

5xx and 429 are retried automatically with exponential backoff and jitter,
twice by default. A `Retry-After` header is honoured when the server sends
one. Nothing else is retried — a 401 or a 404 will not improve on a second
attempt.

```ts
new FormDrop({ apiKey, retries: 0 }); // opt out
```

## Cancelling

Every method takes an `AbortSignal`, and it cancels a pending retry as well as
the request in flight.

```ts
await fd.forms.list({ signal: AbortSignal.timeout(5000) });
```

## Options

```ts
new FormDrop({
  apiKey,               // required for everything except FormDrop.submit
  baseUrl,              // defaults to https://api.formdrop.co
  retries,              // defaults to 2
  fetch,                // defaults to the global
});
```
