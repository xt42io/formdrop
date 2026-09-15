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
import {
  account,
  reportFrequencyEnum,
  session,
  user,
  verification,
} from "./auth-schema";

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
  (table) => [
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
    // A submitted form's fields. Typed rather than left as jsonb's default
    // `unknown`, so callers can read it without a cast — and so a component
    // has no reason to re-declare the shape locally.
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
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
  (table) => [index("notifications_form_id_idx").on(table.formId)],
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
  (table) => [
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
  (table) => [
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
    // Plaintext, and deliberately still here -- but nullable now, which is
    // the difference between "we store keys in plaintext" and "we used to".
    //
    // A key created today writes only the hash and leaves this null. A key
    // created before hashing keeps its plaintext until it is presented once,
    // at which point it is hashed and this is cleared: the risk register's
    // hash-on-next-use dual-read window, so nobody's integration breaks on
    // deploy. Dropping the column is a later migration, after the forced
    // rotation W2 pairs with an in-app and email notice.
    key: text("key").unique(),

    // SHA-256 of the key. Nullable because every row that exists today has no
    // hash yet -- it is filled in the first time that key authenticates.
    keyHash: text("key_hash").unique(),

    // The leading `fd_live_…` characters, kept so the dashboard can identify a
    // key in a list. Once the plaintext is gone this is the only human-
    // readable handle a key has.
    keyPrefix: text("key_prefix"),

    name: text("name"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_key_idx").on(table.key),
    index("api_keys_key_hash_idx").on(table.keyHash),
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
  (table) => [
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
  (table) => [
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

/**
 * Where a submission's deliveries are queued and their outcomes recorded.
 *
 * D8: a Postgres job table, not queue infrastructure. `POST /f/:slug` writes
 * the submission, the usage counter and one row per channel in a single
 * transaction, then returns -- so a delivery cannot be lost by a process
 * dying between storing the submission and fanning it out, which is what
 * happens today.
 *
 * A worker drains it with retry and exponential backoff. Rows that exhaust
 * their attempts are left as `failed` rather than deleted: W2's acceptance is
 * that a provider outage delays delivery but never loses a submission, and a
 * row that disappears on its last retry is indistinguishable from one that
 * was never queued.
 */
export const outboxChannelEnum = pgEnum("outbox_channel", [
  "email",
  "slack",
  "discord",
  "google_sheets",
  "webhook",
]);

export const outboxStatusEnum = pgEnum("outbox_status", [
  "pending",
  "delivered",
  "failed",
]);

export const notificationOutbox = pgTable(
  "notification_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),

    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),

    channel: outboxChannelEnum("channel").notNull(),

    /** The email address, webhook URL or spreadsheet id this row delivers to. */
    target: text("target").notNull(),

    status: outboxStatusEnum("status").default("pending").notNull(),

    attempts: integer("attempts").default(0).notNull(),

    /** The last failure, kept so a stuck row can be diagnosed without logs. */
    lastError: text("last_error"),

    /**
     * When the worker may next pick this row up. Backoff is expressed by
     * pushing this forward rather than by sleeping, so a restart does not
     * reset a row's schedule.
     */
    nextAttemptAt: timestamp("next_attempt_at").defaultNow().notNull(),

    deliveredAt: timestamp("delivered_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // The worker's only query: due, pending, oldest first.
    index("notification_outbox_due_idx").on(table.status, table.nextAttemptAt),

    index("notification_outbox_submission_idx").on(table.submissionId),
    index("notification_outbox_form_idx").on(table.formId),
  ],
);

export const emailDeliveryStatusEnum = pgEnum("email_delivery_status", [
  "sent",
  "failed",
]);

/**
 * Every email FormDrop sends, and what happened to it (PRD W7).
 *
 * Today a failed send is a line in a log nobody reads, so "did my
 * notification go out?" is not a question support can answer. A row per send
 * with the provider's own message id makes it one that can be looked up with
 * the provider, and the PRD's plan is to surface these in the dashboard.
 *
 * Deliberately not a foreign key to submissions or recipients. This table
 * outlives what it describes -- the interesting case is a notification for a
 * submission somebody has since deleted -- and a cascade would erase exactly
 * the history it exists to keep.
 */
export const emailDeliveries = pgTable(
  "email_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * The account this send belongs to, when there is one.
     *
     * Nullable because recipient verification goes to somebody who may have
     * no account at all, and that send still has to be debuggable.
     */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    /** Which template produced it, e.g. "new_submission". */
    template: text("template").notNull(),

    recipient: text("recipient").notNull(),

    subject: text("subject").notNull(),

    /** Adapter name: "resend", "zeptomail", later "sendbyte". */
    provider: text("provider").notNull(),

    status: emailDeliveryStatusEnum("status").notNull(),

    /** The provider's id for the message. Null on failure, and for providers that give none. */
    providerMessageId: text("provider_message_id"),

    /** The failure, kept so it can be read without going to the logs. */
    error: text("error"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // "What has this account been sent, newest first" -- the dashboard view.
    index("email_deliveries_user_idx").on(table.userId, table.createdAt),

    // "What is failing right now", which is the operational question.
    index("email_deliveries_status_idx").on(table.status, table.createdAt),
  ],
);

/*
 * The enum is re-exported so drizzle-kit sees it *declared*, not merely
 * referenced: without this the generated migration carried the ALTER TABLE
 * but no CREATE TYPE, and would have failed on apply.
 */
export { account, reportFrequencyEnum, session, user, verification };
