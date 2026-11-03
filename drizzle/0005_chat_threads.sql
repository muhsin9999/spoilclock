ALTER TABLE "farm_messages" ADD COLUMN "thread" uuid;--> statement-breakpoint
CREATE INDEX "farm_messages_thread" ON "farm_messages" USING btree ("run_id","thread","created_at");