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

    it("routes to Discord when enabled and configured", () => {
      const targets = resolveNotificationTargets(
        {
          discordNotificationsEnabled: true,
          discordWebhookUrl: "https://discord.test/hook",
          discordChannelName: "#submissions",
        },
        OWNER,
      );
      expect(targets.discord).toEqual({
        webhookUrl: "https://discord.test/hook",
        channelName: "#submissions",
      });
    });

    it("does not route to Discord when configured but disabled", () => {
      const targets = resolveNotificationTargets(
        { discordWebhookUrl: "https://discord.test/hook" },
        OWNER,
      );
      expect(targets.discord).toBeNull();
    });

    it("does not route to Discord when enabled but not configured", () => {
      const targets = resolveNotificationTargets(
        { discordNotificationsEnabled: true },
        OWNER,
      );
      expect(targets.discord).toBeNull();
    });

    // A webhook can be connected before a channel name is stored, so both
    // channels report the name as null rather than undefined -- the senders
    // read it to caption the message and would print "undefined" otherwise.
    it("reports a missing channel name as null, not undefined", () => {
      const targets = resolveNotificationTargets(
        {
          slackNotificationsEnabled: true,
          slackWebhookUrl: "https://hooks.slack.test/abc",
          discordNotificationsEnabled: true,
          discordWebhookUrl: "https://discord.test/hook",
        },
        OWNER,
      );
      expect(targets.slack?.channelName).toBeNull();
      expect(targets.discord?.channelName).toBeNull();
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

    // The token outlives the spreadsheet choice: disconnecting a sheet clears
    // the id but the OAuth grant stays, so this combination is reachable.
    it("does not route when the spreadsheet is missing", () => {
      const targets = resolveNotificationTargets(
        { googleSheetsEnabled: true, googleSheetsAccessToken: "token-1" },
        OWNER,
      );
      expect(targets.googleSheets).toBeNull();
    });

    it("does not route when fully configured but disabled", () => {
      const targets = resolveNotificationTargets(
        {
          googleSheetsSpreadsheetId: "sheet-1",
          googleSheetsAccessToken: "token-1",
        },
        OWNER,
      );
      expect(targets.googleSheets).toBeNull();
    });
  });
});
