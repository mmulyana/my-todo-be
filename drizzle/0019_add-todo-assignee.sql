ALTER TABLE "Todo" ADD COLUMN "assignee" text;--> statement-breakpoint
CREATE INDEX "todo_user_assignee_idx" ON "Todo" USING btree ("userId","assignee");