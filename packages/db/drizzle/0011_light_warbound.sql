ALTER TABLE "buckets" RENAME TO "forms";--> statement-breakpoint
ALTER TABLE "email_notification_recipients" RENAME COLUMN "bucket_id" TO "form_id";--> statement-breakpoint
ALTER TABLE "events" RENAME COLUMN "bucket_id" TO "form_id";--> statement-breakpoint
ALTER TABLE "notification_usage" RENAME COLUMN "bucket_id" TO "form_id";--> statement-breakpoint
ALTER TABLE "notifications" RENAME COLUMN "bucket_id" TO "form_id";--> statement-breakpoint
ALTER TABLE "submissions" RENAME COLUMN "bucket_id" TO "form_id";--> statement-breakpoint
ALTER TABLE "usage" RENAME COLUMN "bucket_id" TO "form_id";--> statement-breakpoint
ALTER TABLE "forms" DROP CONSTRAINT "buckets_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "email_notification_recipients" DROP CONSTRAINT "email_notification_recipients_bucket_id_buckets_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_bucket_id_buckets_id_fk";
--> statement-breakpoint
ALTER TABLE "notification_usage" DROP CONSTRAINT "notification_usage_bucket_id_buckets_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_bucket_id_buckets_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_bucket_id_buckets_id_fk";
--> statement-breakpoint
ALTER TABLE "usage" DROP CONSTRAINT "usage_bucket_id_buckets_id_fk";
--> statement-breakpoint
DROP INDEX "user_bucket_unique_idx";--> statement-breakpoint
DROP INDEX "buckets_user_id_idx";--> statement-breakpoint
DROP INDEX "email_notification_recipients_bucket_id_idx";--> statement-breakpoint
DROP INDEX "events_bucket_created_idx";--> statement-breakpoint
DROP INDEX "notifications_bucket_id_idx";--> statement-breakpoint
DROP INDEX "submissions_bucket_created_idx";--> statement-breakpoint
DROP INDEX "submissions_bucket_id_idx";--> statement-breakpoint
DROP INDEX "notification_usage_unique_idx";--> statement-breakpoint
DROP INDEX "usage_unique_idx";--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_notification_recipients" ADD CONSTRAINT "email_notification_recipients_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_usage" ADD CONSTRAINT "notification_usage_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_form_unique_idx" ON "forms" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "forms_user_id_idx" ON "forms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_notification_recipients_form_id_idx" ON "email_notification_recipients" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "events_form_created_idx" ON "events" USING btree ("form_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_form_id_idx" ON "notifications" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "submissions_form_created_idx" ON "submissions" USING btree ("form_id","created_at");--> statement-breakpoint
CREATE INDEX "submissions_form_id_idx" ON "submissions" USING btree ("form_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_usage_unique_idx" ON "notification_usage" USING btree ("user_id","form_id","period","type");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_unique_idx" ON "usage" USING btree ("user_id","form_id","period");--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "public"."events" ALTER COLUMN "event_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."event_type";--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('form_created', 'submission_created', 'submission_deleted', 'notification_sent', 'api_key_generated', 'integration_synced');--> statement-breakpoint
ALTER TABLE "public"."events" ALTER COLUMN "event_type" SET DATA TYPE "public"."event_type" USING "event_type"::"public"."event_type";