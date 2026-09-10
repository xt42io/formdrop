import { describe, expect, it } from "vitest";
import {
  MAX_ATTEMPTS,
  isExhausted,
  nextAttemptDelayMs,
  plannedDeliveries,
} from "./outbox.ts";
import type { NotificationTargets } from "./notifications.ts";

const none: NotificationTargets = {
  emails: [],
  slack: null,
  discord: null,
  googleSheets: null,
};

describe("plannedDeliveries", () => {
  it("produces nothing when no channel is configured", () => {
    expect(plannedDeliveries(none)).toEqual([]);
  });

  it("produces a row per email recipient rather than one for the group", () => {
    const planned = plannedDeliveries({
      ...none,
      emails: ["owner@example.com", "team@example.com"],
    });

    // The point of one row each: a bounced address fails alone instead of
    // taking the other recipients down or being skipped on the retry.
    expect(planned).toEqual([
      { channel: "email", target: "owner@example.com" },
      { channel: "email", target: "team@example.com" },
    ]);
  });

  it("stores the webhook URL as the target for slack and discord", () => {
    const planned = plannedDeliveries({
      ...none,
      slack: { webhookUrl: "https://hooks.slack.test/a", channelName: "#in" },
      discord: { webhookUrl: "https://discord.test/b", channelName: null },
    });

    expect(planned).toEqual([
      { channel: "slack", target: "https://hooks.slack.test/a" },
      { channel: "discord", target: "https://discord.test/b" },
    ]);
  });

  it("stores the spreadsheet id for sheets, not the access token", () => {
    const planned = plannedDeliveries({
      ...none,
      googleSheets: { spreadsheetId: "sheet-1", accessToken: "ya29.secret" },
    });

    expect(planned).toEqual([{ channel: "google_sheets", target: "sheet-1" }]);
    // A token snapshotted at collect time would be stale by the time a retry
    // ran, and would be a credential sitting in a queue table.
    expect(JSON.stringify(planned)).not.toContain("ya29.secret");
  });

  it("covers every configured channel at once", () => {
    const planned = plannedDeliveries({
      emails: ["a@example.com"],
      slack: { webhookUrl: "s", channelName: null },
      discord: { webhookUrl: "d", channelName: null },
      googleSheets: { spreadsheetId: "g", accessToken: "t" },
    });

    expect(planned.map((p) => p.channel)).toEqual([
      "email",
      "slack",
      "discord",
      "google_sheets",
    ]);
  });
});

describe("nextAttemptDelayMs", () => {
  it("waits 30 seconds after the first failure", () => {
    expect(nextAttemptDelayMs(1)).toBe(30_000);
  });

  it("lengthens with each failure", () => {
    const delays = [1, 2, 3, 4, 5].map(nextAttemptDelayMs);
    expect(delays).toEqual([30_000, 120_000, 300_000, 900_000, 1_800_000]);

    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]);
    }
  });

  it("caps rather than doubling forever", () => {
    // An outage lasting hours should be retried every half hour, not backed
    // off into next week.
    expect(nextAttemptDelayMs(6)).toBe(1_800_000);
    expect(nextAttemptDelayMs(50)).toBe(1_800_000);
  });

  it("treats a zero or negative count as the first failure", () => {
    expect(nextAttemptDelayMs(0)).toBe(30_000);
    expect(nextAttemptDelayMs(-3)).toBe(30_000);
  });
});

describe("isExhausted", () => {
  it("keeps retrying below the limit", () => {
    expect(isExhausted(MAX_ATTEMPTS - 1)).toBe(false);
  });

  it("gives up at the limit", () => {
    expect(isExhausted(MAX_ATTEMPTS)).toBe(true);
    expect(isExhausted(MAX_ATTEMPTS + 1)).toBe(true);
  });
});
