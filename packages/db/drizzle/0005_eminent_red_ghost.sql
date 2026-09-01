ALTER TABLE "email_notification_recipients" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_notification_recipients" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "email_notification_recipients" ADD COLUMN "verification_token_expires_at" timestamp;