ALTER TABLE "subscriptions" ADD COLUMN "polar_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_polar_id_unique" UNIQUE("polar_id");