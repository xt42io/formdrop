import { config } from "dotenv";
import { createApp } from "./app";
import { startOutboxWorker } from "../worker";
import { initSentry } from "../lib/sentry";

// One .env at the repo root serves every workspace, matching what apps/web
// does with Vite's envDir. dotenv defaults to the working directory, which
// under Turbo is apps/api -- where there is no .env, so every environment
// variable would silently be undefined.
config({ path: new URL("../../../../.env", import.meta.url) });

// Before the app is built, so a fault during startup is reported too. A
// no-op without SENTRY_DSN, which is the normal state locally and in CI.
initSentry();

const port = Number(process.env.PORT ?? 1400);

createApp().listen(port, ({ hostname, port }) => {
  console.log(`FormDrop API (Elysia/Bun) on http://${hostname}:${port}`);
});

/*
 * The outbox worker runs beside the API (D8: no queue infrastructure).
 *
 * In-process is enough at this size and means there is nothing extra to
 * deploy. It is safe to run more than one -- rows are claimed with FOR UPDATE
 * SKIP LOCKED -- so scaling the API horizontally scales delivery with it, and
 * moving the worker onto its own process later is an import away.
 *
 * OUTBOX_WORKER=off leaves the rows queued, which is what a deployment wants
 * if it ever does run delivery separately.
 */
const stopWorker =
  process.env.OUTBOX_WORKER === "off" ? undefined : startOutboxWorker();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    // Stops claiming new rows. Anything already claimed has had its next
    // attempt scheduled, so an interrupted send is retried rather than lost.
    stopWorker?.();
    process.exit(0);
  });
}
