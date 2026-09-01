ALTER TABLE "impersonation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "impersonation" CASCADE;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "banned";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "ban_reason";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "ban_expires";