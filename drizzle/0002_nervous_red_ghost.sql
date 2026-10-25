ALTER TABLE "files" ADD COLUMN "data" text;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "floor_share" integer DEFAULT 75 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "blocked" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "day" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "crop" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "pallets" integer;