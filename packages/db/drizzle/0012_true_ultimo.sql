DROP INDEX "api_keys_user_type_unique";--> statement-breakpoint
DROP INDEX "user_form_unique_idx";--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "name" text;--> statement-breakpoint
CREATE UNIQUE INDEX "user_form_unique_active_idx" ON "forms" USING btree ("user_id","name") WHERE "forms"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "api_keys" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE "public"."api_key_type";