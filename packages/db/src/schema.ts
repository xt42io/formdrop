import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  uniqueIndex,
  index,
  pgEnum,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { isNull } from "drizzle-orm";
import { account, session, user, verification } from "./auth-schema";

export const notificationTypeEnum = pgEnum("notification_type", [
  "email",
  "webhook",
  "slack",
  "discord",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "form_created",
  "submission_created",
  "submission_deleted",
  "notification_sent",
  "api_key_generated",
  "integration_synced",
]);

export const forms = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    description: text("description"),
    emailNotificationsEnabled: boolean("email_notifications_enabled")
      .default(true)
      .notNull(),

    // Slack integration
    slackWebhookUrl: text("slack_webhook_url"),
    slackChannelId: text("slack_channel_id"),
    slackChannelName: text("slack_channel_name"),
    slackTeamName: text("slack_team_name"),
    slackNotificationsEnabled: boolean("slack_notifications_enabled")
      .default(false)
      .notNull(),

    // Discord integration
    discordWebhookUrl: text("discord_webhook_url"),
    discordChannelId: text("discord_channel_id"),
    discordChannelName: text("discord_channel_name"),
    discordGuildName: text("discord_guild_name"),
    discordNotificationsEnabled: boolean("discord_notifications_enabled")
      .default(false)
      .notNull(),

    // Google Sheets integration
    googleSheetsAccessToken: text("google_sheets_access_token"),
    googleSheetsRefreshToken: text("google_sheets_refresh_token"),
    googleSheetsTokenExpiry: timestamp("google_sheets_token_expiry"),
    googleSheetsSpreadsheetId: text("google_sheets_spreadsheet_id"),
    googleSheetsSpreadsheetName: text("google_sheets_spreadsheet_name"),
    googleSheetsSheetId: text("google_sheets_sheet_id"),
    googleSheetsEnabled: boolean("google_sheets_enabled")
      .default(false)
      .notNull(),

    // Airtable integration
    airtableAccessToken: text("airtable_access_token"),
    airtableRefreshToken: text("airtable_refresh_token"),
    airtableTokenExpiry: timestamp("airtable_token_expiry"),
    airtableBaseId: text("airtable_base_id"),
    airtableBaseName: text("airtable_base_name"),
    airtableTableId: text("airtable_table_id"),
    airtableTableName: text("airtable_table_name"),
    airtableEnabled: boolean("airtable_enabled").default(false).notNull(),

    allowedDomains: jsonb("allowed_domains").$type<string[]>().default([]),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table: any) => [
    uniqueIndex("user_form_unique_active_idx")
      .on(table.userId, table.name)
      .where(isNull(table.deletedAt)),

    index("forms_user_id_idx").on(table.userId),
  ],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    payload: jsonb("payload").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table: any) => [
    index("submissions_form_created_idx").on(table.formId, table.createdAt),

    index("submissions_form_id_idx").on(table.formId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    target: text("target").notNull(),
    enabled: text("enabled").default("true").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table: any) => [index("notifications_form_id_idx").on(table.formId)],
);

export const emailNotificationRecipients = pgTable(
  "email_notification_recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    verifiedAt: timestamp("verified_at"),
    verificationToken: text("verification_token"),
    verificationTokenExpiresAt: timestamp("verification_token_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table: any) => [
    index("email_notification_recipients_form_id_idx").on(table.formId),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    formId: uuid("form_id").references(() => forms.id, {
      onDelete: "set null",
    }),
    eventType: eventTypeEnum("event_type").notNull(),
    details: jsonb("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table: any) => [
    index("events_user_created_idx").on(table.userId, table.createdAt),

    index("events_form_created_idx").on(table.formId, table.createdAt),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull().unique(),
    name: text("name"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table: any) => [
    index("api_keys_key_idx").on(table.key),
    index("api_keys_user_id_idx").on(table.userId),
  ],
);

export const usage = pgTable(
  "usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),

    // for daily counting — easiest for quotas
    period: text("period").notNull(),

    count: integer("count").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table: any) => [
    // prevent duplicate rows per period
    uniqueIndex("usage_unique_idx").on(
      table.userId,
      table.formId,
      table.period,
    ),
    index("usage_user_period_idx").on(table.userId, table.period),
  ],
);

export const notificationUsage = pgTable(
  "notification_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),

    type: notificationTypeEnum("type").notNull(),

    // for daily counting — easiest for quotas
    period: text("period").notNull(),

    count: integer("count").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table: any) => [
    // prevent duplicate rows per period
    uniqueIndex("notification_usage_unique_idx").on(
      table.userId,
      table.formId,
      table.period,
      table.type,
    ),
    index("notification_usage_user_period_idx").on(table.userId, table.period),
  ],
);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "trialing",
  "paused",
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  polarId: text("polar_id").unique(),
  plan: text("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export { account, session, user, verification };
