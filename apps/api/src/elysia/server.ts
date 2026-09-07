import { config } from "dotenv";
import { createApp } from "./app";

// One .env at the repo root serves every workspace, matching what apps/web
// does with Vite's envDir. dotenv defaults to the working directory, which
// under Turbo is apps/api -- where there is no .env, so every environment
// variable would silently be undefined.
config({ path: new URL("../../../../.env", import.meta.url) });

const port = Number(process.env.PORT ?? 1400);

createApp().listen(port, ({ hostname, port }) => {
  console.log(`FormDrop API (Elysia/Bun) on http://${hostname}:${port}`);
});
