ALTER TABLE "buckets" ADD COLUMN "google_sheets_access_token" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "google_sheets_refresh_token" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "google_sheets_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "google_sheets_spreadsheet_id" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "google_sheets_spreadsheet_name" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "google_sheets_sheet_id" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "google_sheets_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "airtable_access_token" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "airtable_refresh_token" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "airtable_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "airtable_base_id" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "airtable_base_name" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "airtable_table_id" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "airtable_table_name" text;--> statement-breakpoint
ALTER TABLE "buckets" ADD COLUMN "airtable_enabled" boolean DEFAULT false NOT NULL;