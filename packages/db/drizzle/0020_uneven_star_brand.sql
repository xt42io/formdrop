CREATE TYPE "public"."report_frequency" AS ENUM('off', 'weekly', 'monthly');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "report_frequency" "report_frequency" DEFAULT 'weekly' NOT NULL;