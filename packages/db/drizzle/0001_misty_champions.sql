CREATE TABLE "notification_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"bucket_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"period" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_usage" ADD CONSTRAINT "notification_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_usage" ADD CONSTRAINT "notification_usage_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_usage_unique_idx" ON "notification_usage" USING btree ("user_id","bucket_id","period","type");--> statement-breakpoint
CREATE INDEX "notification_usage_user_period_idx" ON "notification_usage" USING btree ("user_id","period");