import { describe, expect, it } from "vitest";
import { resolveNotificationTargets } from "./notifications.ts";

const OWNER = "owner@example.com";

describe("resolveNotificationTargets", () => {
  it("returns nothing for a form with every channel off", () => {
    expect(resolveNotificationTargets({}, OWNER)).toEqual({
      emails: [],
      slack: null,
      discord: null,
      googleSheets: null,
    });
  });

  describe("email", () => {
    it("sends to the owner when enabled with no other recipients", () => {
      const targets = resolveNotificationTargets(
        { emailNotificationsEnabled: true },
        OWNER,
      );
      expect(targets.emails).toEqual([OWNER]);
    });

    it("includes verified recipients after the owner", () => {
      const targets = resolveNotificationTargets(
        { emailNotificationsEnabled: true },
        OWNER,
        [{ email: "team@example.com" }],
      );
      expect(targets.emails).toEqual([OWNER, "team@example.com"]);
    });

    it("deduplicates a recipient that is also the owner", () => {
      const targets = resolveNotificationTargets(
        { emailNotificationsEnabled: true },
        OWNER,
        [{ email: OWNER }, { email: "team@example.com" }],
      );
      expect(targets.emails).toEqual([OWNER, "team@example.com"]);
    });

    it("sends to nobody when email is off, even with recipients", () => {
      const targets = resolveNotificationTargets({}, OWNER, [
        { email: "team@example.com" },
      ]);
      expect(targets.emails).toEqual([]);
    });
  });

  describe("webhook channels", () => {
    it("routes to Slack when enabled and configured", () => {
      const targets = resolveNotificationTargets(
        {
          slackNotificationsEnabled: true,
          slackWebhookUrl: "https://hooks.slack.test/abc",
          slackChannelName: "#leads",
        },
        OWNER,
      );
      expect(targets.slack).toEqual({
        webhookUrl: "https://hooks.slack.test/abc",
        channelName: "#leads",
      });
    });

    it("does not route to Slack when enabled but not configured", () => {
      const targets = resolveNotificationTargets(
        { slackNotificationsEnabled: true },
        OWNER,
      );
      expect(targets.slack).toBeNull();
    });

    it("does not route to Discord when configured but disabled", () => {
      const targets = resolveNotificationTargets(
        { discordWebhookUrl: "https://discord.test/hook" },
        OWNER,
      );
      expect(targets.discord).toBeNull();
    });
  });

  describe("google sheets", () => {
    it("routes when enabled with a spreadsheet and a token", () => {
      const targets = resolveNotificationTargets(
        {
          googleSheetsEnabled: true,
          googleSheetsSpreadsheetId: "sheet-1",
          googleSheetsAccessToken: "token-1",
        },
        OWNER,
      );
      expect(targets.googleSheets).toEqual({
        spreadsheetId: "sheet-1",
        accessToken: "token-1",
      });
    });

    it("does not route when the token is missing", () => {
      const targets = resolveNotificationTargets(
        { googleSheetsEnabled: true, googleSheetsSpreadsheetId: "sheet-1" },
        OWNER,
      );
      expect(targets.googleSheets).toBeNull();
    });
  });
});
