import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import { API_PORT, WEB_PORT, WEB_URL, serverEnv } from "./e2e/env";

/**
 * The smoke path spans both servers: the dashboard is TanStack Start in this
 * app, but `POST /f/:slug` is Express in apps/api, so a submission cannot be
 * collected without both running.
 *
 * Both are run from their builds rather than their dev servers. The Nitro dev
 * worker currently crashes on startup -- a pre-existing fault, unrelated to
 * these tests -- and a built server is closer to what CI and production run
 * anyway.
 */
export default defineConfig({
  testDir: "./e2e",
  // Signup touches a third-party billing call, so a run is slower than a
  // typical page test and the default 30s is tight.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // The path shares one account and one form across its steps, so the steps
  // are ordered and must not be split across workers.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Playwright's bundled Chromium cannot be downloaded on every network; the
    // locally installed Chrome drives this suite identically. CI installs the
    // bundled browser, where the download is reliable, so it leaves this unset.
    ...(process.env.CI ? {} : { channel: "chrome" as const }),
  },

  webServer: [
    {
      command: "node .output/server/index.mjs",
      url: WEB_URL,
      cwd: fileURLToPath(new URL(".", import.meta.url)),
      env: { ...serverEnv, PORT: String(WEB_PORT) },
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 120_000,
    },
    {
      command: "node dist/index.js",
      // healthRouter is mounted at "/" with its route at "/", so the health
      // check is the API root -- there is no /health path.
      url: `http://localhost:${API_PORT}/`,
      // fileURLToPath, not a URL pathname: this repo's path contains a
      // space, which stays percent-encoded and produces a cwd that does
      // not exist, so the server would never start.
      cwd: fileURLToPath(new URL("../api", import.meta.url)),
      env: { ...serverEnv, PORT: String(API_PORT) },
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 120_000,
    },
  ],
});
