CREATE TABLE "buyer_cards" (
	"buyer_id" text PRIMARY KEY NOT NULL,
	"vault_id" text NOT NULL,
	"brand" text NOT NULL,
	"last4" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "dock_key" text DEFAULT replace(gen_random_uuid()::text, '-', '') NOT NULL;--> statement-breakpoint
ALTER TABLE "paypal_events" ADD COLUMN "deal_id" uuid;