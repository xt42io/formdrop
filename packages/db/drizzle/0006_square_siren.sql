ALTER TABLE "buckets" ADD COLUMN "slack_webhook_url" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "slack_channel_id" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "slack_channel_name" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "slack_team_name" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "slack_notifications_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "discord_webhook_url" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "discord_channel_id" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "discord_channel_name" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "discord_guild_name" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "discord_notifications_enabled" boolean DEFAULT false NOT NULL;